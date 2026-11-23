const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'kora_time_maroc_2025_secret_ultra_secure';

// Middleware d'authentification JWT
const auth = (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer '))
    return res.status(401).json({ success: false, msg: 'Authentification requise.' });

  try {
    const decoded = jwt.verify(header.split(' ')[1], JWT_SECRET);
    req.userId = decoded.id;
    req.userMode = decoded.currentMode;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, msg: 'Token invalide ou expiré.' });
  }
};

// Middleware : uniquement mode organisateur
const organizerOnly = (req, res, next) => {
  if (req.userMode !== 'organizer')
    return res.status(403).json({ success: false, msg: 'Accès réservé aux organisateurs.' });
  next();
};

// Middleware : uniquement mode joueur
const playerOnly = (req, res, next) => {
  if (req.userMode !== 'player')
    return res.status(403).json({ success: false, msg: 'Accès réservé aux joueurs.' });
  next();
};

module.exports = { auth, organizerOnly, playerOnly, JWT_SECRET };
