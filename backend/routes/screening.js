const express = require('express');
const router = express.Router();

const controller = require('../controllers/screeningController');

router.post('/', controller.screen);

module.exports = router;
