require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3010;

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./config/db');
    const { rows } = await pool.query('SELECT NOW() AS now');
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: rows[0].now,
    });
  } catch (err) {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'unavailable',
    });
  }
});

const authRoutes = require('./routes/auth');
const jobsRoutes = require('./routes/jobs');
const candidatesRoutes = require('./routes/candidates');
const applicationsRoutes = require('./routes/applications');
const resumesRoutes = require('./routes/resumes');
const screeningRoutes = require('./routes/screening');
const interviewsRoutes = require('./routes/interviews');

app.use('/api/auth', authRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/candidates', candidatesRoutes);
app.use('/api/applications', applicationsRoutes);
app.use('/api/resumes', resumesRoutes);
app.use('/api/screening', screeningRoutes);
app.use('/api/interviews', interviewsRoutes);

app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} does not exist`,
  });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.status ? 'Request Error' : 'Server Error',
    message: err.message || 'Something went wrong',
  });
});

app.listen(PORT, () => {
  console.log(`TalentFlow AI server running at http://localhost:${PORT}`);
});

module.exports = app;
