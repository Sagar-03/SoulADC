const express = require('express');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  sendResetOTP,
  verifyResetOTP,
  resetPasswordWithToken,
  sendVerificationOTP,
  verifyEmailOTP,
  sendPreRegistrationOTP,
  verifyPreRegistrationOTP,
  submitDiscountLead
} = require('../controllers/authcontroller');
const router = express.Router();

// Pre-registration email verification routes (before actual registration)
router.post("/send-pre-registration-otp", sendPreRegistrationOTP);
router.post("/verify-pre-registration-otp", verifyPreRegistrationOTP);

// Registration and email verification routes
router.post('/register', register); 
router.post("/send-verification-otp", sendVerificationOTP);
router.post("/verify-email-otp", verifyEmailOTP);

// Login route
router.post('/login', login);

// Legacy routes (keeping for compatibility)
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// New OTP-based password reset routes
router.post("/send-reset-otp", sendResetOTP);
router.post("/verify-reset-otp", verifyResetOTP);
router.post("/reset-password-with-token", resetPasswordWithToken);

// Discount lead — public, no auth needed
router.post('/discount-lead', submitDiscountLead);

module.exports = router;