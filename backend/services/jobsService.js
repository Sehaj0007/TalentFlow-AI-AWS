const pool = require('../config/db');

exports.listJobs = async (db) => {
  const { rows } = await db.query(
    'SELECT * FROM jobs ORDER BY created_at DESC'
  );
  return rows;
};

exports.createJob = async (db, payload) => {
  const {
    title,
    department,
    location,
    type,
    applicants = 0,
  } = payload;
  const { rows } = await db.query(
    `INSERT INTO jobs (title, department, location, type, applicants)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [title, department, location, type, applicants]
  );
  return rows[0];
};
