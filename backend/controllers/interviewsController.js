const pool = require('../config/db');

exports.list = async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM interviews ORDER BY date ASC, time ASC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const {
      candidate,
      role,
      date,
      time,
      interviewer,
      status = 'Scheduled',
      link = 'https://meet.google.com/',
    } = req.body || {};
    const { rows } = await pool.query(
      `INSERT INTO interviews (candidate, role, date, time, interviewer, status, link)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [candidate, role, date, time, interviewer, status, link]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
};
