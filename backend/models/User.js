const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, trim: true, lowercase: true },
  passwordHash: { type: String, required: true },
  currentMode: { type: String, enum: ['player', 'organizer'], default: 'player' },
  phone: { type: String, default: '' },
  level: { type: String, enum: ['débutant', 'intermédiaire', 'confirmé', ''], default: '' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
