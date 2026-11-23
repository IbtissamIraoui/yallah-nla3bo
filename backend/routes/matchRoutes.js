const express = require('express');
const mongoose = require('mongoose');
const Match = require('../models/Match');
const User = require('../models/User');
const { auth, organizerOnly, playerOnly } = require('../middleware/auth');

const router = express.Router();

// Liste des matchs selon le mode de l'utilisateur connecte.
router.get('/', auth, async (req, res) => {
  try {
    const query = req.userMode === 'organizer'
      ? { organizerId: req.userId }
      : { status: 'open', dateTime: { $gt: new Date() } };
    const matches = await Match.find(query)
      .sort({ dateTime: req.userMode === 'organizer' ? -1 : 1 })
      .populate('players.userId', 'name level');
    res.json({ success: true, matches });
  } catch (e) {
    console.error('Erreur liste matchs:', e);
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES ORGANISATEUR
// ═══════════════════════════════════════════════════════════════

// ─── Créer et publier un match ────────────────────────────────
router.post('/', auth, organizerOnly, async (req, res) => {
  try {
    const { title, description, lng, lat, address, dateTime, durationMinutes, playersNeeded, price, level } = req.body;

    if (!title?.trim())
      return res.status(400).json({ success: false, msg: 'Le titre est obligatoire.' });
    if (lng == null || lat == null)
      return res.status(400).json({ success: false, msg: 'La localisation (longitude, latitude) est obligatoire.' });
    if (!dateTime)
      return res.status(400).json({ success: false, msg: 'La date et heure sont obligatoires.' });
    if (!playersNeeded || playersNeeded < 2)
      return res.status(400).json({ success: false, msg: 'Le nombre de joueurs doit être au moins 2.' });

    const matchDate = new Date(dateTime);
    if (matchDate <= new Date())
      return res.status(400).json({ success: false, msg: 'La date du match doit être dans le futur.' });

    const match = await Match.create({
      organizerId: req.userId,
      title: title.trim(),
      description: description || '',
      location: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
      address: address || '',
      dateTime: matchDate,
      durationMinutes: durationMinutes || 90,
      playersNeeded: parseInt(playersNeeded),
      price: price || 0,
      level: level || 'tous',
      players: [],
      status: 'open'
    });

    res.json({ success: true, match, msg: 'Match publié avec succès !' });
  } catch (e) {
    console.error('Erreur création match:', e);
    res.status(500).json({ success: false, msg: 'Erreur serveur lors de la création du match.' });
  }
});

// ─── Mes matchs organisés ─────────────────────────────────────
router.get('/mine', auth, organizerOnly, async (req, res) => {
  try {
    const matches = await Match.find({ organizerId: req.userId })
      .sort({ dateTime: -1 })
      .populate('players.userId', 'name email phone level');

    res.json({ success: true, matches });
  } catch (e) {
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ─── Modifier un match ────────────────────────────────────────
router.put('/:id', auth, organizerOnly, async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.id, organizerId: req.userId });
    if (!match)
      return res.status(404).json({ success: false, msg: 'Match introuvable ou vous n\'êtes pas l\'organisateur.' });
    if (match.status === 'cancelled')
      return res.status(400).json({ success: false, msg: 'Impossible de modifier un match annulé.' });

    const { title, description, lng, lat, address, dateTime, durationMinutes, playersNeeded, price, level } = req.body;

    if (title) match.title = title.trim();
    if (description !== undefined) match.description = description;
    if (lng != null && lat != null) match.location = { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] };
    if (address !== undefined) match.address = address;
    if (dateTime) match.dateTime = new Date(dateTime);
    if (durationMinutes) match.durationMinutes = durationMinutes;
    if (price !== undefined) match.price = price;
    if (level) match.level = level;

    if (playersNeeded) {
      if (playersNeeded < match.players.length)
        return res.status(400).json({ success: false, msg: `Impossible : ${match.players.length} joueurs déjà inscrits.` });
      match.playersNeeded = playersNeeded;
      // Recalculer le statut
      match.status = match.players.length >= match.playersNeeded ? 'full' : 'open';
    }

    await match.save();
    res.json({ success: true, match, msg: 'Match mis à jour.' });
  } catch (e) {
    console.error('Erreur modification match:', e);
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ─── Annuler un match ─────────────────────────────────────────
router.post('/:id/cancel', auth, organizerOnly, async (req, res) => {
  try {
    const match = await Match.findOneAndUpdate(
      { _id: req.params.id, organizerId: req.userId, status: { $ne: 'cancelled' } },
      { status: 'cancelled' },
      { new: true }
    );
    if (!match)
      return res.status(404).json({ success: false, msg: 'Match introuvable ou déjà annulé.' });

    res.json({ success: true, match, msg: 'Match annulé.' });
  } catch (e) {
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ─── Liste des inscrits d'un match ───────────────────────────
router.get('/:id/players', auth, organizerOnly, async (req, res) => {
  try {
    const match = await Match.findOne({ _id: req.params.id, organizerId: req.userId })
      .populate('players.userId', 'name email phone level');
    if (!match)
      return res.status(404).json({ success: false, msg: 'Match introuvable.' });

    res.json({ success: true, players: match.players, playersNeeded: match.playersNeeded });
  } catch (e) {
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ─── Retirer un joueur d'un match ─────────────────────────────
router.delete('/:id/players/:playerId', auth, organizerOnly, async (req, res) => {
  try {
    const match = await Match.findOneAndUpdate(
      { _id: req.params.id, organizerId: req.userId },
      { $pull: { players: { userId: req.params.playerId } } },
      { new: true }
    );
    if (!match)
      return res.status(404).json({ success: false, msg: 'Match introuvable.' });

    // Repasser en "open" si une place s'est libérée
    if (match.status === 'full' && match.players.length < match.playersNeeded) {
      match.status = 'open';
      await match.save();
    }

    res.json({ success: true, match, msg: 'Joueur retiré du match.' });
  } catch (e) {
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTES JOUEUR
// ═══════════════════════════════════════════════════════════════

// ─── Matchs à proximité ───────────────────────────────────────
router.get('/nearby', auth, async (req, res) => {
  try {
    const { lat, lng, radiusKm = 10 } = req.query;

    if (!lat || !lng)
      return res.status(400).json({ success: false, msg: 'Latitude et longitude obligatoires.' });

    const radiusMeters = parseFloat(radiusKm) * 1000;

    const matches = await Match.aggregate([
      {
        $geoNear: {
          near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          distanceField: 'distance',
          maxDistance: radiusMeters,
          query: {
            status: 'open',
            dateTime: { $gt: new Date() }
          },
          spherical: true
        }
      },
      { $sort: { distance: 1 } },
      {
        $lookup: {
          from: 'users',
          localField: 'organizerId',
          foreignField: '_id',
          as: 'organizer'
        }
      },
      { $unwind: { path: '$organizer', preserveNullAndEmptyArrays: true } },
      {
        $addFields: {
          organizerName: '$organizer.name',
          spotsLeft: { $subtract: ['$playersNeeded', { $size: '$players' }] },
          distanceKm: { $round: [{ $divide: ['$distance', 1000] }, 1] }
        }
      },
      {
        $project: {
          organizer: 0,
          'players.userId': 0
        }
      }
    ]);

    res.json({ success: true, matches });
  } catch (e) {
    console.error('Erreur nearby:', e);
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ─── Détail d'un match ────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.id)
      .populate('organizerId', 'name email phone')
      .populate('players.userId', 'name level');

    if (!match)
      return res.status(404).json({ success: false, msg: 'Match introuvable.' });

    // Ajouter un champ indiquant si l'utilisateur est inscrit
    const matchObj = match.toObject();
    matchObj.isJoined = match.players.some(p => p.userId?._id?.toString() === req.userId);
    matchObj.spotsLeft = match.playersNeeded - match.players.length;

    res.json({ success: true, match: matchObj });
  } catch (e) {
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ─── Rejoindre un match (atomique) ───────────────────────────
router.post('/:id/join', auth, async (req, res) => {
  try {
    // Update atomique : on n'ajoute le joueur que si :
    // - le match est "open"
    // - le joueur n'est pas déjà inscrit
    // - le nombre de joueurs est strictement inférieur à playersNeeded
    // - la date n'est pas passée
    const result = await Match.findOneAndUpdate(
      {
        _id: req.params.id,
        status: 'open',
        dateTime: { $gt: new Date() },
        'players.userId': { $ne: req.userId },
        $expr: { $lt: [{ $size: '$players' }, '$playersNeeded'] }
      },
      {
        $push: {
          players: { userId: req.userId, status: 'confirmed', joinedAt: new Date() }
        }
      },
      { new: true }
    );

    if (!result) {
      // Déterminer la raison exacte de l'échec
      const match = await Match.findById(req.params.id);
      if (!match)
        return res.status(404).json({ success: false, msg: 'Match introuvable.' });
      if (match.status === 'full')
        return res.status(400).json({ success: false, msg: 'Ce match est déjà complet.' });
      if (match.status === 'cancelled')
        return res.status(400).json({ success: false, msg: 'Ce match a été annulé.' });
      if (new Date(match.dateTime) <= new Date())
        return res.status(400).json({ success: false, msg: 'Ce match est déjà passé.' });
      if (match.players.some(p => p.userId.toString() === req.userId))
        return res.status(400).json({ success: false, msg: 'Vous êtes déjà inscrit à ce match.' });
      return res.status(400).json({ success: false, msg: 'Impossible de rejoindre ce match.' });
    }

    // Vérifier si le match est maintenant complet
    if (result.players.length >= result.playersNeeded) {
      result.status = 'full';
      await result.save();
    }

    res.json({
      success: true,
      match: result,
      msg: result.status === 'full'
        ? 'Vous avez rejoint le match ! Le match est maintenant complet.'
        : 'Vous avez rejoint le match !'
    });
  } catch (e) {
    console.error('Erreur join:', e);
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ─── Quitter un match ─────────────────────────────────────────
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const match = await Match.findOneAndUpdate(
      {
        _id: req.params.id,
        'players.userId': req.userId,
        dateTime: { $gt: new Date() }
      },
      { $pull: { players: { userId: req.userId } } },
      { new: true }
    );

    if (!match)
      return res.status(404).json({ success: false, msg: 'Match introuvable, vous n\'êtes pas inscrit, ou le match est déjà passé.' });

    // Repasser en "open" si le match était complet
    if (match.status === 'full') {
      match.status = 'open';
      await match.save();
    }

    res.json({ success: true, match, msg: 'Vous avez quitté le match.' });
  } catch (e) {
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ─── Mes matchs rejoints (joueur) ─────────────────────────────
router.get('/player/joined', auth, async (req, res) => {
  try {
    const matches = await Match.find({
      'players.userId': req.userId,
      status: { $ne: 'cancelled' }
    })
      .sort({ dateTime: 1 })
      .populate('organizerId', 'name phone');

    const results = matches.map(m => {
      const obj = m.toObject();
      obj.spotsLeft = m.playersNeeded - m.players.length;
      return obj;
    });

    res.json({ success: true, matches: results });
  } catch (e) {
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

module.exports = router;
