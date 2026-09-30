const express = require('express');
const router = express.Router();

router.post('/login', (req, res, next) => {
  require('../controllers/authController').login(req, res, next);
});

router.post('/register', (req, res, next) => {
  require('../controllers/authController').register(req, res, next);
});

module.exports = router;