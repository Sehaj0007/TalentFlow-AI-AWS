require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./models/seed');

const app = express();
const PORT = process.env.PORT || 3010;

const frontendOrigin = process.env.FRONTEND_URL || process.env.CORS_ORIGIN || '*';
const corsOptions = {
  origin: frontendOrigin === '*' ? true : frontendOrigin,
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/api/health', async (req, res) => {
  try {
    const pool = require('./config/db');
    await pool.query('SELECT 1');
    return res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      db: 'connected',
    });
  } catch (err) {
    console.error('Health check failed:', err.message);
    return res.status(503).json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      db: 'unavailable',
      message: 'Database service is temporarily unavailable',
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

  const message = err && err.status
    ? err.message || 'Something went wrong'
    : (err && /ECONNREFUSED|ETIMEDOUT|ENOTFOUND|connection/i.test(err.message || ''))
      ? 'Database service is temporarily unavailable'
      : 'Something went wrong';

  res.status(err.status || 500).json({
    error: err.status ? 'Request Error' : 'Server Error',
    message,
  });
});

(async () => {
  try {
    await initializeDatabase();
  } catch (err) {
    console.error('Database initialization failed:', err.message);
  }

  app.listen(PORT, () => {
    console.log(`TalentFlow AI server running at http://localhost:${PORT}`);
  });
})();

module.exports = app;
