const express = require('express');
const router = express.Router();

const controller = require('../controllers/candidatesController');

router.get('/', controller.list);
router.post('/', controller.create);
router.patch('/:id', controller.update);

module.exports = router;
