const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Match = require('./models/Match');

// Coordonnées de matchs autour de Casablanca
const SEED_MATCHES = [
  {
    title: 'Match du Samedi - Maârif',
    description: 'Match amical au terrain City Foot Maârif. Ambiance garantie !',
    lng: -7.6328, lat: 33.5883,
    address: 'City Foot Maârif, Casablanca',
    hoursFromNow: 48,
    durationMinutes: 90,
    playersNeeded: 10,
    price: 30,
    level: 'tous'
  },
  {
    title: 'Foot 5v5 - Ain Diab',
    description: 'Petit match 5 contre 5 sur synthétique.',
    lng: -7.6700, lat: 33.5950,
    address: 'Terrain Ain Diab, Corniche, Casablanca',
    hoursFromNow: 72,
    durationMinutes: 60,
    playersNeeded: 10,
    price: 25,
    level: 'intermédiaire'
  },
  {
    title: 'Match détente - Sidi Maarouf',
    description: 'Match cool entre amis. Tous niveaux bienvenus.',
    lng: -7.6520, lat: 33.5450,
    address: 'Complexe Sportif Sidi Maarouf, Casablanca',
    hoursFromNow: 96,
    durationMinutes: 90,
    playersNeeded: 14,
    price: 0,
    level: 'débutant'
  },
  {
    title: 'Tournoi du Dimanche - Hay Hassani',
    description: 'Tournoi mini-foot. Venez nombreux !',
    lng: -7.6830, lat: 33.5620,
    address: 'Terrain Municipal Hay Hassani, Casablanca',
    hoursFromNow: 120,
    durationMinutes: 120,
    playersNeeded: 16,
    price: 40,
    level: 'confirmé'
  },
  {
    title: 'Match express - Bouskoura',
    description: 'Match rapide 1h, presque complet ! Dépêchez-vous.',
    lng: -7.6480, lat: 33.5100,
    address: 'Green Foot Bouskoura, Casablanca',
    hoursFromNow: 24,
    durationMinutes: 60,
    playersNeeded: 8,
    price: 35,
    level: 'tous'
  }
];

async function seed() {
  try {
    // Vérifier si les données existent déjà
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('🌱 Seed ignoré : des données existent déjà.');
      return;
    }

    console.log('🌱 Seed en cours...');

    const hash = await bcrypt.hash('123456', 10);

    // Créer le compte organisateur
    const orga = await User.create({
      name: 'Organisateur Test',
      email: 'orga@test.com',
      passwordHash: hash,
      currentMode: 'organizer'
    });
    console.log('  ✅ Organisateur créé : orga@test.com / 123456');

    // Créer le compte joueur
    const joueur = await User.create({
      name: 'Joueur Test',
      email: 'joueur@test.com',
      passwordHash: hash,
      currentMode: 'player'
    });
    console.log('  ✅ Joueur créé : joueur@test.com / 123456');

    // Créer les matchs
    for (let i = 0; i < SEED_MATCHES.length; i++) {
      const m = SEED_MATCHES[i];
      const dateTime = new Date(Date.now() + m.hoursFromNow * 60 * 60 * 1000);

      const matchData = {
        organizerId: orga._id,
        title: m.title,
        description: m.description,
        location: { type: 'Point', coordinates: [m.lng, m.lat] },
        address: m.address,
        dateTime,
        durationMinutes: m.durationMinutes,
        playersNeeded: m.playersNeeded,
        price: m.price,
        level: m.level,
        players: [],
        status: 'open'
      };

      // Le 5ème match (Bouskoura) : pré-remplir avec des joueurs pour qu'il soit "presque complet"
      if (i === 4) {
        // Créer 6 joueurs fictifs sur 8 nécessaires
        const fakePlayerIds = [];
        for (let j = 1; j <= 6; j++) {
          const fakePlayer = await User.create({
            name: `Joueur${j}`,
            email: `joueur${j}@fake.com`,
            passwordHash: hash,
            currentMode: 'player'
          });
          fakePlayerIds.push({
            userId: fakePlayer._id,
            status: 'confirmed',
            joinedAt: new Date()
          });
        }
        matchData.players = fakePlayerIds;
      }

      await Match.create(matchData);
      console.log(`  ⚽ Match créé : ${m.title} (${m.playersNeeded} joueurs, ${m.price} DH)`);
    }

    console.log('🌱 Seed terminé ! 2 comptes + 5 matchs créés.');
    console.log('   📧 orga@test.com / 123456 (organisateur)');
    console.log('   📧 joueur@test.com / 123456 (joueur)');
  } catch (err) {
    console.error('❌ Erreur seed:', err);
  }
}

module.exports = seed;
