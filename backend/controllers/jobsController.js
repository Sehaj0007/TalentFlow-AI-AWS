const pool = require('../config/db');
const service = require('../services/jobsService');

exports.list = async (req, res, next) => {
  try {
    const rows = await service.listJobs(pool);
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const job = await service.createJob(pool, req.body || {});
    res.status(201).json(job);
  } catch (err) {
    next(err);
  }
};
