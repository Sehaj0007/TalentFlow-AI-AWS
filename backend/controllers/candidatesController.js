const pool = require('../config/db');
const service = require('../services/candidatesService');

exports.list = async (req, res, next) => {
  try {
    const rows = await service.listCandidates(pool, req.query || {});
    res.json(rows);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    const candidate = await service.createCandidate(pool, req.body || {});
    res.status(201).json(candidate);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const candidate = await service.updateCandidate(
      pool,
      parseInt(req.params.id, 10),
      req.body || {}
    );
    if (!candidate) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Candidate not found',
      });
    }
    res.json(candidate);
  } catch (err) {
    next(err);
  }
};
