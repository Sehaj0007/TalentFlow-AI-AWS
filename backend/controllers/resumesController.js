const path = require('path');
const multer = require('multer');
const pool = require('../config/db');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '..', 'uploads'));
  },
  filename: (req, file, cb) => {
    const stamp = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.bin';
    cb(null, `resume-${stamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

exports.upload = [
  upload.single('file'),
  async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'No file uploaded (expected field name: "file")',
        });
      }
      const candidateId = req.body.candidateId
        ? parseInt(req.body.candidateId, 10)
        : null;
      const { rows } = await pool.query(
        `INSERT INTO resumes (candidate_id, filename, filepath)
         VALUES ($1, $2, $3) RETURNING *`,
        [candidateId, req.file.originalname, req.file.path]
      );
      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  },
];
