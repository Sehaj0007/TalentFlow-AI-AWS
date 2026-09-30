const express = require('express');
const router = express.Router();

const controller = require('../controllers/resumesController');
const { authenticate } = require('../middleware/auth');

router.post('/upload', authenticate, controller.upload);

module.exports = router;
