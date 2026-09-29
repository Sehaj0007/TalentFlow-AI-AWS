const pool = require('../config/db');

exports.get = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    const { rows } = await pool.query(
      'SELECT * FROM applications WHERE id = $1',
      [id]
    );
    if (!rows.length) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Application not found',
      });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const { candidate_id, job_id, status = 'Applied' } = req.body || {};
    const { rows } = await pool.query(
      `INSERT INTO applications (candidate_id, job_id, status)
       VALUES ($1, $2, $3) RETURNING *`,
      [candidate_id, job_id, status]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};
