const pool = require('../config/db');
const service = require('../services/screeningService');

exports.screen = async (req, res, next) => {
  try {
    const { candidateId, jobId } = req.body || {};
    if (!candidateId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'candidateId is required',
      });
    }
    let candidate = null;
    try {
      const { rows } = await pool.query(
        'SELECT * FROM candidates WHERE id = $1',
        [parseInt(candidateId, 10)]
      );
      candidate = rows[0] || null;
    } catch (_) {
      candidate = null;
    }
    const result = service.scoreCandidate(candidateId, candidate, jobId);
    res.json(result);
  } catch (err) {
    next(err);
  }
};
