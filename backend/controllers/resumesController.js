const path = require('path');
const multer = require('multer');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

const pool = require('../config/db');

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'eu-north-1',
});

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
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

      if (
        req.body.candidateId &&
        Number.isNaN(candidateId)
      ) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'candidateId must be a valid integer',
        });
      }

      const bucket = process.env.TALENTFLOW_S3_BUCKET;

      if (!bucket) {
        throw new Error(
          'TALENTFLOW_S3_BUCKET environment variable is not configured'
        );
      }

      const extension =
        path.extname(req.file.originalname) || '.bin';

      const safeExtension = extension
        .toLowerCase()
        .replace(/[^a-z0-9.]/g, '');

      const uniqueName =
        `resume-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExtension}`;

      const candidatePrefix = candidateId
        ? `candidate-${candidateId}`
        : 'unassigned';

      const key = `resumes/${candidatePrefix}/${uniqueName}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: key,
          Body: req.file.buffer,
          ContentType:
            req.file.mimetype || 'application/octet-stream',

          Metadata: {
            originalFilename: req.file.originalname,
            ...(candidateId
              ? {
                  candidateId: String(candidateId),
                }
              : {}),
          },
        })
      );

      const s3Path = `s3://${bucket}/${key}`;

      const { rows } = await pool.query(
        `
        INSERT INTO resumes
          (candidate_id, filename, filepath)
        VALUES
          ($1, $2, $3)
        RETURNING *
        `,
        [
          candidateId,
          req.file.originalname,
          s3Path,
        ]
      );

      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  },
];