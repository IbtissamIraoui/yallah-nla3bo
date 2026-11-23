require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const matchRoutes = require('./routes/matchRoutes');
const playerRoutes = require('./routes/playerRoutes');
const seed = require('./seed');

const app = express();
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 3001;
const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/koratime';

// ─── Connexion MongoDB ────────────────────────────────────────
async function connectDatabase() {
  let isMemory = false;
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ MongoDB connecté !');
  } catch (err) {
    console.error('❌ Erreur MongoDB:', err.message);
    // Fallback sur MongoDB en mémoire pour le développement local
    if (MONGO_URI.includes('127.0.0.1') || MONGO_URI.includes('localhost')) {
      try {
        const { MongoMemoryServer } = require('mongodb-memory-server');
        const memoryMongo = await MongoMemoryServer.create();
        await mongoose.connect(memoryMongo.getUri());
        isMemory = true;
        console.log('✅ MongoDB mémoire connecté (développement).');
      } catch (memErr) {
        console.error('❌ Erreur MongoDB mémoire:', memErr.message);
        return;
      }
    } else {
      return;
    }
  }

  // Créer les index géospatiaux
  const Match = require('./models/Match');
  await Match.createIndexes();
  console.log('✅ Index géospatiaux créés.');

  // Auto-seed en mode mémoire (les données sont perdues à chaque redémarrage)
  if (isMemory) {
    await seed();
  }
}

connectDatabase();

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/players', playerRoutes);

// ─── Health check ─────────────────────────────────────────────
app.get('/', (req, res) => res.send('🏟️ KORA TIME BACKEND — Marketplace de matchs'));

// ─── Démarrage ────────────────────────────────────────────────
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 SERVEUR KORA TIME → http://192.168.1.100:${PORT}`);
});
