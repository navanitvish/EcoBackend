const express = require('express');
const router = express.Router();
const {
  register,
  login,
  verifyOTP,
  resendOTP,
  googleAuth
} = require('../controllers/authController');

// POST /api/auth/register - Step 1: Register and send OTP
router.post('/register', register);

// POST /api/auth/verify-otp - Step 2: Verify OTP and get token
router.post('/verify-otp', verifyOTP);

// POST /api/auth/resend-otp - Resend OTP if needed
router.post('/resend-otp', resendOTP);

// POST /api/auth/login - Login for verified users
router.post('/login', login);

// POST /api/auth/google - Google OAuth (auto-verified)
router.post('/google', googleAuth);  // Add this route

module.exports = router;