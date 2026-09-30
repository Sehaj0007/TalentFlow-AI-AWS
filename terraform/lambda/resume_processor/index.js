const { S3Client, HeadObjectCommand } = require('@aws-sdk/client-s3');
const { Pool } = require('pg');

const s3 = new S3Client({
  region: process.env.AWS_REGION,
});

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  max: 2,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 5000,

  ssl: {
    rejectUnauthorized: false,
  },
});

exports.handler = async (event) => {
  const batchItemFailures = [];

  for (const record of event.Records || []) {
    try {
      await processMessage(record);

      console.log('Resume message processed successfully', {
        messageId: record.messageId,
      });
    } catch (error) {
      console.error('Resume processing failed', {
        messageId: record.messageId,
        error: error.message,
      });

      batchItemFailures.push({
        itemIdentifier: record.messageId,
      });
    }
  }

  return {
    batchItemFailures,
  };
};

async function processMessage(record) {
  const body = JSON.parse(record.body);

  if (!body.Records || body.Records.length === 0) {
    throw new Error('SQS message does not contain an S3 event');
  }

  for (const s3Record of body.Records) {
    const bucket = s3Record.s3.bucket.name;

    const key = decodeURIComponent(
      s3Record.s3.object.key.replace(/\+/g, ' ')
    );

    if (!key.startsWith('resumes/')) {
      console.log('Ignoring non-resume object', key);
      continue;
    }

    console.log('Processing resume', {
      bucket,
      key,
    });

    // Verify that the object exists in S3.
    await s3.send(
      new HeadObjectCommand({
        Bucket: bucket,
        Key: key,
      })
    );

    const s3Path = `s3://${bucket}/${key}`;

    const client = await pool.connect();

    try {
      const result = await client.query(
        `
        UPDATE resumes
        SET filepath = $1
        WHERE filepath = $1
        RETURNING id, candidate_id, filename, filepath
        `,
        [s3Path]
      );

      if (result.rowCount === 0) {
        /*
         * The upload event can reach SQS before the Express request
         * finishes inserting the database record.
         *
         * Throwing here causes SQS/Lambda to retry the message.
         */
        throw new Error(
          `Resume database record not found for S3 path: ${s3Path}`
        );
      }

      console.log('Resume database record verified', result.rows[0]);
    } finally {
      client.release();
    }
  }
}