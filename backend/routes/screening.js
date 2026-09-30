const express = require('express');
const router = express.Router();

const controller = require('../controllers/screeningController');
const { authenticate } = require('../middleware/auth');

router.post('/', authenticate, controller.screen);

module.exports = router;
