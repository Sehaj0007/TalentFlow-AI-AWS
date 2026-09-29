const pool = require('../config/db');

exports.listCandidates = async (db, query) => {
  const { search, stage, role, sort } = query;
  const clauses = [];
  const params = [];

  if (search) {
    params.push(`%${search.toLowerCase()}%`);
    clauses.push(
      `(LOWER(name) LIKE $${params.length} OR LOWER(email) LIKE $${params.length} OR LOWER(role) LIKE $${params.length})`
    );
  }
  if (stage && stage !== 'all') {
    params.push(stage);
    clauses.push(`stage = $${params.length}`);
  }
  if (role && role !== 'all') {
    params.push(role);
    clauses.push(`role = $${params.length}`);
  }

  let order = 'created_at DESC';
  if (sort === 'score') order = 'score DESC, created_at DESC';
  else if (sort === 'name') order = 'name ASC';
  else if (sort === 'recent') order = 'applied_date DESC, created_at DESC';

  let sql = 'SELECT * FROM candidates';
  if (clauses.length) sql += ` WHERE ${clauses.join(' AND ')}`;
  sql += ` ORDER BY ${order}`;

  const { rows } = await db.query(sql, params);
  return rows;
};

exports.createCandidate = async (db, payload) => {
  const {
    name,
    email,
    role,
    experience = '',
    score = 75,
    stage = 'Applied',
    applied_date,
    source = 'Website',
  } = payload;
  const applied = applied_date || new Date().toISOString().slice(0, 10);
  const { rows } = await db.query(
    `INSERT INTO candidates (name, email, role, experience, score, stage, applied_date, source)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (email) DO UPDATE SET
       name = EXCLUDED.name,
       role = EXCLUDED.role,
       experience = EXCLUDED.experience,
       score = EXCLUDED.score,
       stage = EXCLUDED.stage,
       applied_date = EXCLUDED.applied_date,
       source = EXCLUDED.source
     RETURNING *`,
    [name, email, role, experience, Number(score), stage, applied, source]
  );
  return rows[0];
};

exports.updateCandidate = async (db, id, payload) => {
  const fields = [];
  const params = [];
  const allowed = [
    'name',
    'email',
    'role',
    'experience',
    'score',
    'stage',
    'applied_date',
    'source',
  ];
  allowed.forEach((key) => {
    if (payload[key] !== undefined) {
      params.push(payload[key]);
      fields.push(`${key} = $${params.length}`);
    }
  });
  if (!fields.length) {
    const { rows } = await db.query('SELECT * FROM candidates WHERE id = $1', [id]);
    return rows[0] || null;
  }
  params.push(id);
  const { rows } = await db.query(
    `UPDATE candidates SET ${fields.join(', ')} WHERE id = $${params.length} RETURNING *`,
    params
  );
  return rows[0] || null;
};
