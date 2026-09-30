const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'talentflow-dev-secret-change-me';

function sanitizeUser(user) {
  if (!user) return null;
  return {
    id: user.id,
    first_name: user.first_name || '',
    last_name: user.last_name || '',
    name: user.name || `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email,
    email: user.email,
    role: user.role || 'user',
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}

function signToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role || 'user',
    },
    JWT_SECRET,
    { expiresIn: '12h' }
  );
}

async function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    let userResult;

    try {
      userResult = await pool.query(
        `SELECT id, first_name, last_name, name, email, role, created_at, updated_at
         FROM users WHERE id = $1`,
        [payload.sub]
      );
    } catch (dbErr) {
      console.error('Auth DB lookup failed:', dbErr.message);
      return res.status(503).json({ message: 'Database service is temporarily unavailable' });
    }

    if (userResult.rowCount === 0) {
      return res.status(401).json({ message: 'Invalid or expired session' });
    }

    req.user = sanitizeUser(userResult.rows[0]);
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired session' });
  }
}

module.exports = {
  authenticate,
  signToken,
  sanitizeUser,
  JWT_SECRET,
};
