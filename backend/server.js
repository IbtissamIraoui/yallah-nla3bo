require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { MongoMemoryServer } = require('mongodb-memory-server');

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// Modèles
const Player = require('./models/Player');
const Match = require('./models/Match');

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/koratime';
const JWT_SECRET = process.env.JWT_SECRET || 'kora_time_maroc_2025_secret_ultra_secure';

async function connectDatabase() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('MongoDB connecté !');
  } catch (err) {
    if (MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('localhost')) {
      try {
        const memoryMongo = await MongoMemoryServer.create();
        await mongoose.connect(memoryMongo.getUri());
        console.log('MongoDB mémoire installé et connecté !');
      } catch (memoryErr) {
        console.log('Mongo erreur:', err);
        console.log('Mongo mémoire erreur:', memoryErr);
      }
    } else {
      console.log('Mongo erreur:', err);
    }
  }
}

connectDatabase();

// User (auth)
const userSchema = new mongoose.Schema({
  fullname: String,
  email: { type: String, unique: true, required: true },
  password: String
});
const User = mongoose.model('User', userSchema);

// Middleware Auth
const auth = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: 'Pas de token' });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(403).json({ msg: 'Token invalide' });
  }
};

// === ROUTES AUTH ===
app.post('/api/register', async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ fullname, email, password: hash });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !await bcrypt.compare(password, user.password))
      return res.status(401).json({ success: false, msg: 'Mauvais identifiants' });
    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, user: { fullname: user.fullname } });
  } catch (e) {
    res.status(500).json({ success: false });
  }
});

// === PLAYERS CRUD ===

// GET joueurs
app.get('/api/players', auth, async (req, res) => {
  const players = await Player.find();
  res.json({ success: true, players });
});

// ADD joueur
app.post('/api/players', auth, async (req, res) => {
  const player = await Player.create(req.body);
  res.json({ success: true, player });
});

// UPDATE joueur ✨ (Nouvelle route)
app.put('/api/players/:id', auth, async (req, res) => {
  try {
    const updated = await Player.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json({ success: true, updated });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// DELETE joueur
app.delete('/api/players/:id', auth, async (req, res) => {
  await Player.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// === MATCHES CRUD ===

// GET matches
app.get('/api/matches', auth, async (req, res) => {
  const matches = await Match.find()
    .sort({ date: -1 })
    .populate('feuilleDeMatch.joueurId');
  res.json({ success: true, matches });
});

// ADD match
app.post('/api/matches', auth, async (req, res) => {
  const match = await Match.create(req.body);
  res.json({ success: true, match });
});

// UPDATE match
app.put('/api/matches/:id', auth, async (req, res) => {
  const match = await Match.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json({ success: true, match });
});

// DELETE match ✨ (Nouvelle route)
app.delete('/api/matches/:id', auth, async (req, res) => {
  try {
    await Match.findByIdAndDelete(req.params.id);
    res.json({ success: true, msg: 'Match supprimé' });
  } catch (e) {
    res.status(400).json({ success: false, error: e.message });
  }
});

// === DASHBOARD ===
app.get('/api/dashboard', auth, async (req, res) => {
  const prochainMatch = await Match.findOne()
    .sort({ date: 1 })
    .populate('feuilleDeMatch.joueurId');

  const total = await Match.aggregate([
    { $unwind: "$feuilleDeMatch" },
    { $match: { "feuilleDeMatch.paye": true } },
    { $group: { _id: null, total: { $sum: "$feuilleDeMatch.montantPaye" } } }
  ]);

  res.json({
    success: true,
    prochainMatch,
    totalCaisse: total[0]?.total || 0
  });
});

app.get('/', (req, res) => res.send('KORA TIME BACKEND 100% OP'));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SERVEUR KORA TIME LANCÉ → http://192.168.1.100:${PORT}`);
});
