require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const demoPassword = process.env.DEMO_ADMIN_PASSWORD;

const config = {
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT, 10) || 5432,
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
};
const TARGET_DB = process.env.PGDATABASE || 'talentflow';

async function ensureDatabase() {
  const sysPool = new Pool({ ...config, database: 'postgres' });
  try {
    const check = await sysPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [TARGET_DB]
    );
    if (!check.rowCount) {
      console.log(`Creating database "${TARGET_DB}"...`);
      await sysPool.query(`CREATE DATABASE "${TARGET_DB}"`);
      console.log(`Database "${TARGET_DB}" created.`);
    } else {
      console.log(`Database "${TARGET_DB}" already exists.`);
    }
  } catch (err) {
    console.warn(
      `Could not auto-create database "${TARGET_DB}". Please create it manually if needed. Error: ${err.message}`
    );
  } finally {
    await sysPool.end();
  }
}

function splitStatements(sql) {
  const stmts = [];
  let buf = '';
  let depth = 0;
  let inStr = false;
  let strCh = null;
  for (let i = 0; i < sql.length; i++) {
    const ch = sql[i];
    const prev = sql[i - 1];
    if (inStr) {
      buf += ch;
      if (ch === strCh && prev !== '\\') inStr = false;
      continue;
    }
    if (ch === "'" || ch === '"') {
      inStr = true;
      strCh = ch;
      buf += ch;
      continue;
    }
    if (ch === '(') { depth++; buf += ch; continue; }
    if (ch === ')') { depth--; buf += ch; continue; }
    if (ch === ';' && depth === 0) {
      const s = buf.trim();
      if (s) stmts.push(s + ';');
      buf = '';
      continue;
    }
    buf += ch;
  }
  const tail = buf.trim();
  if (tail) stmts.push(tail.endsWith(';') ? tail : tail + ';');
  return stmts;
}

async function applySchema(pool) {
  const schemaPath = path.join(__dirname, 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');
  const statements = splitStatements(sql);
  console.log(`Applying ${statements.length} schema statement(s)...`);
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (err) {
      console.warn('Schema statement warning:', err.message);
    }
  }
  console.log('Schema applied.');
}

async function seedUsers(pool) {
  const email = 'admin@talentflowai.com';
  const { rowCount } = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (rowCount) {
    console.log('Demo user already exists, skipping.');
    return;
  }
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  await pool.query(
    'INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)',
    ['Admin', email, passwordHash]
  );
  console.log('Demo admin user inserted.');
}

async function seedCandidates(pool) {
  const demo = [
    ['Aarav Mehta', 'aarav@example.com', 'Frontend Developer', '3 years', 94, 'Interview', '2026-09-25', 'LinkedIn'],
    ['Priya Shah', 'priya@example.com', 'Python Developer', '2 years', 91, 'Screening', '2026-09-24', 'Referral'],
    ['Rohan Patil', 'rohan@example.com', 'DevOps Engineer', '4 years', 88, 'Shortlisted', '2026-09-23', 'Indeed'],
    ['Sneha Kulkarni', 'sneha@example.com', 'Data Analyst', '2 years', 86, 'Applied', '2026-09-22', 'Website'],
    ['Vikram Joshi', 'vikram@example.com', 'Backend Developer', '5 years', 82, 'Offer', '2026-09-20', 'LinkedIn'],
  ];
  let added = 0;
  for (const row of demo) {
    const [name, email, role, experience, score, stage, applied_date, source] = row;
    const { rowCount } = await pool.query('SELECT id FROM candidates WHERE email = $1', [email]);
    if (!rowCount) {
      await pool.query(
        `INSERT INTO candidates (name, email, role, experience, score, stage, applied_date, source)
         VALUES ($1, $2, $3, $4, $5, $6, $7::date, $8)`,
        [name, email, role, experience, score, stage, applied_date, source]
      );
      added++;
    }
  }
  console.log(`Inserted ${added} candidate(s) (demo).`);
}

async function seedJobs(pool) {
  const demo = [
    ['Frontend Developer', 'Engineering', 'Mumbai / Hybrid', 'Full-time', 18],
    ['Python Developer', 'Engineering', 'Remote', 'Full-time', 12],
    ['Data Analyst', 'Analytics', 'Pune / Hybrid', 'Full-time', 9],
  ];
  let added = 0;
  for (const [title, department, location, type, applicants] of demo) {
    const { rowCount } = await pool.query(
      'SELECT id FROM jobs WHERE title = $1 AND department = $2',
      [title, department]
    );
    if (!rowCount) {
      await pool.query(
        `INSERT INTO jobs (title, department, location, type, applicants)
         VALUES ($1, $2, $3, $4, $5)`,
        [title, department, location, type, applicants]
      );
      added++;
    }
  }
  console.log(`Inserted ${added} job(s) (demo).`);
}

async function seedInterviews(pool) {
  const demo = [
    ['Aarav Mehta', 'Frontend Developer', '2026-09-28', '10:30 AM', 'Neha Sharma', 'Scheduled', 'https://meet.google.com/'],
    ['Rohan Patil', 'DevOps Engineer', '2026-09-29', '2:00 PM', 'Rahul Verma', 'Pending', 'https://meet.google.com/'],
    ['Priya Shah', 'Python Developer', '2026-09-30', '11:00 AM', 'Anita Rao', 'Scheduled', 'https://meet.google.com/'],
  ];
  let added = 0;
  for (const [candidate, role, date, time, interviewer, status, link] of demo) {
    const { rowCount } = await pool.query(
      'SELECT id FROM interviews WHERE candidate = $1 AND role = $2 AND date = $3::date',
      [candidate, role, date]
    );
    if (!rowCount) {
      await pool.query(
        `INSERT INTO interviews (candidate, role, date, time, interviewer, status, link)
         VALUES ($1, $2, $3::date, $4, $5, $6, $7)`,
        [candidate, role, date, time, interviewer, status, link]
      );
      added++;
    }
  }
  console.log(`Inserted ${added} interview(s) (demo).`);
}

async function seedNotifications(pool) {
  const { rows: userRows } = await pool.query(
    "SELECT id FROM users WHERE email = 'admin@talentflowai.com' LIMIT 1"
  );
  if (!userRows.length) return;
  const userId = userRows[0].id;
  const { rowCount } = await pool.query(
    'SELECT id FROM notifications WHERE user_id = $1',
    [userId]
  );
  if (rowCount) return;
  await pool.query(
    `INSERT INTO notifications (user_id, title, message, read)
     VALUES ($1, 'Welcome to TalentFlow AI', 'Your recruitment workspace is ready.', false)`,
    [userId]
  );
  console.log('Inserted welcome notification (demo).');
}

async function main() {
  await ensureDatabase();
  const pool = new Pool({ ...config, database: TARGET_DB });
  try {
    await applySchema(pool);
    await seedUsers(pool);
    await seedCandidates(pool);
    await seedJobs(pool);
    await seedInterviews(pool);
    await seedNotifications(pool);
    const counts = {};
    for (const t of ['users', 'candidates', 'jobs', 'interviews', 'notifications']) {
      const { rows } = await pool.query(`SELECT count(*)::int AS n FROM ${t}`);
      counts[t] = rows[0].n;
    }
    console.log('Counts:', counts);
    console.log('Seed complete.');
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
