const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },

  // GeoJSON Point pour les requêtes $geoNear / $near
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [lng, lat]
  },
  address: { type: String, default: '' },

  dateTime: { type: Date, required: true },
  durationMinutes: { type: Number, default: 90 },
  playersNeeded: { type: Number, required: true, min: 2 },

  price: { type: Number, default: 0 },           // 0 = gratuit
  level: { type: String, enum: ['débutant', 'intermédiaire', 'confirmé', 'tous', ''], default: 'tous' },

  players: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['confirmed'], default: 'confirmed' },
    joinedAt: { type: Date, default: Date.now }
  }],

  status: { type: String, enum: ['open', 'full', 'cancelled', 'finished'], default: 'open' },

  createdAt: { type: Date, default: Date.now }
});

// Index géospatial pour les recherches par distance
matchSchema.index({ location: '2dsphere' });

// Index composé pour les requêtes fréquentes
matchSchema.index({ status: 1, dateTime: 1 });
matchSchema.index({ organizerId: 1, createdAt: -1 });

module.exports = mongoose.model('Match', matchSchema);
