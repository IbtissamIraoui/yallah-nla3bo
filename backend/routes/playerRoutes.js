const express = require('express');
const Player = require('../models/Player');
const { auth, organizerOnly } = require('../middleware/auth');

const router = express.Router();

// ─── GET tous les joueurs (vestiaire) ─────────────────────────
router.get('/', auth, organizerOnly, async (req, res) => {
  try {
    const players = await Player.find();
    res.json({ success: true, players });
  } catch (e) {
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

// ─── Ajouter un joueur au vestiaire ───────────────────────────
router.post('/', auth, organizerOnly, async (req, res) => {
  try {
    const player = await Player.create(req.body);
    res.json({ success: true, player });
  } catch (e) {
    res.status(400).json({ success: false, msg: e.message });
  }
});

// ─── Modifier un joueur ───────────────────────────────────────
router.put('/:id', auth, organizerOnly, async (req, res) => {
  try {
    const updated = await Player.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updated)
      return res.status(404).json({ success: false, msg: 'Joueur introuvable.' });
    res.json({ success: true, player: updated });
  } catch (e) {
    res.status(400).json({ success: false, msg: e.message });
  }
});

// ─── Supprimer un joueur ──────────────────────────────────────
router.delete('/:id', auth, organizerOnly, async (req, res) => {
  try {
    await Player.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: 'Joueur supprimé.' });
  } catch (e) {
    res.status(500).json({ success: false, msg: 'Erreur serveur.' });
  }
});

module.exports = router;
