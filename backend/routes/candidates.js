const express = require('express');
const router = express.Router();

const controller = require('../controllers/candidatesController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, controller.list);
router.post('/', authenticate, controller.create);
router.patch('/:id', authenticate, controller.update);

module.exports = router;
