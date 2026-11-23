const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { auth, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ─── Inscription ──────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, currentMode } = req.body;

    if (!name?.trim())
      return res.status(400).json({ success: false, msg: 'Le nom est obligatoire.' });
    if (!email?.trim())
      return res.status(400).json({ success: false, msg: "L'email est obligatoire." });
    if (!password || password.length < 6)
      return res.status(400).json({ success: false, msg: 'Le mot de passe doit contenir au moins 6 caractères.' });
    if (!['player', 'organizer'].includes(currentMode))
      return res.status(400).json({ success: false, msg: 'Mode invalide. Choisissez "player" ou "organizer".' });

    const existing = await User.findOne({ email: email.trim().toLowerCase() });
    if (existing)
      return res.status(409).json({ success: false, msg: 'Un compte existe déjà avec cet email.' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      currentMode
    });

    res.json({ success: true, msg: 'Compte créé avec succès !' });
  } catch (e) {
    console.error('Erreur inscription:', e);
    res.status(500).json({ success: false, msg: 'Erreur serveur lors de l\'inscription.' });
  }
});

// ─── Connexion ────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, msg: 'Email et mot de passe obligatoires.' });

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user)
      return res.status(401).json({ success: false, msg: 'Mauvais identifiants.' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid)
      return res.status(401).json({ success: false, msg: 'Mauvais identifiants.' });

    const token = jwt.sign(
      { id: user._id, currentMode: user.currentMode },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        currentMode: user.currentMode,
        phone: user.phone,
        level: user.level
      }
    });
  } catch (e) {
    console.error('Erreur login:', e);
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ─── Profil (GET) ─────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-passwordHash');
    if (!user)
      return res.status(404).json({ success: false, msg: 'Utilisateur introuvable.' });
    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ─── Changer de mode (player <-> organizer) ───────────────────
router.post('/switch-mode', auth, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user)
      return res.status(404).json({ success: false, msg: 'Utilisateur introuvable.' });

    user.currentMode = user.currentMode === 'player' ? 'organizer' : 'player';
    await user.save();

    // Générer un nouveau token avec le mode mis à jour
    const token = jwt.sign(
      { id: user._id, currentMode: user.currentMode },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        currentMode: user.currentMode,
        phone: user.phone,
        level: user.level
      },
      msg: `Mode changé en ${user.currentMode === 'player' ? 'joueur' : 'organisateur'}.`
    });
  } catch (e) {
    console.error('Erreur switch-mode:', e);
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ─── Modifier le profil ───────────────────────────────────────
router.put('/profile', auth, async (req, res) => {
  try {
    const { name, phone, level } = req.body;
    const updates = {};
    if (name?.trim()) updates.name = name.trim();
    if (phone !== undefined) updates.phone = phone;
    if (level !== undefined) updates.level = level;

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-passwordHash');
    if (!user)
      return res.status(404).json({ success: false, msg: 'Utilisateur introuvable.' });

    res.json({ success: true, user });
  } catch (e) {
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

module.exports = router;
