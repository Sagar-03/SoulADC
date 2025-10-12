const express = require('express');
const { register, login, forgotPassword, resetPassword } = require('../controllers/authcontroller');
const router = express.Router();

router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);
router.post('/register', register); 
router.post('/login', login);

module.exports = router;