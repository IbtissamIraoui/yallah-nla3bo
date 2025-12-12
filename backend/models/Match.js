const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  nom: { type: String, default: "Match du Jour" },
  date: { type: String, required: true },        // ex: "2025-12-10"
  heure: { type: String, required: true },       // ex: "20:00"
  terrain: { type: String, default: "City Foot Casablanca" },
  prixTotal: { type: Number, default: 300 },

  // 🆕 Localisation complète
  localisation: {
    adresse: { type: String, default: "" },      // Ex: "Bd Ghandi, Casablanca"
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null }
  },

  feuilleDeMatch: [{
    joueurId: { type: mongoose.Schema.Types.ObjectId, ref: 'Player' },
    present: { type: Boolean, default: true },
    paye: { type: Boolean, default: false },
    montantPaye: { type: Number, default: 0 }
  }],

  creeLe: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Match', matchSchema);
