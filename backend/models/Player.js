const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  position: { type: String, default: 'ATT' }, // ATT, DEF, GK
  note: { type: Number, default: 3, min: 1, max: 5 },
  traits: { type: String, default: '' }
});

module.exports = mongoose.model('Player', playerSchema);