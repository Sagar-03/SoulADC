const express = require('express');
const { register, login, forgotPassword, resetPassword, sendResetOTP, verifyResetOTP, resetPasswordWithToken } = require('../controllers/authcontroller');
const router = express.Router();

// Legacy routes (keeping for compatibility)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// New OTP-based password reset routes
router.post("/send-reset-otp", sendResetOTP);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password-with-token", resetPasswordWithToken);

router.post('/register', register); 
router.post('/login', login);

module.exports = router;