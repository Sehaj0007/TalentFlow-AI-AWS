const express = require('express');
const router = express.Router();

const controller = require('../controllers/applicationsController');
const { authenticate } = require('../middleware/auth');

router.get('/:id', authenticate, controller.get);
router.post('/', authenticate, controller.create);

module.exports = router;
