const express = require('express');
const router = express.Router();

const controller = require('../controllers/jobsController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, controller.list);
router.post('/', authenticate, controller.create);

module.exports = router;
