// server/routes/auth.js
const express = require('express');
const router = express.Router();
const { validate, registerSchema, verifyOTPSchema, loginSchema } = require('../middleware/validate');
const { authMiddleware } = require('../middleware/auth');
const {
  register,
  verifyOTPAndCreateAccount,
  resendOTP,
  login,
  getProfile,
  logout,
} = require('../controllers/authController');

/**
 * @route POST /api/auth/register
 * @description Register with phone number and send OTP
 * @body { phone, firstName, lastName, email }
 */
router.post('/register', validate(registerSchema), register);

/**
 * @route POST /api/auth/verify-otp
 * @description Verify OTP and create account
 * @body { phone, otp, password, firstName, lastName }
 */
router.post('/verify-otp', validate(verifyOTPSchema), verifyOTPAndCreateAccount);

/**
 * @route POST /api/auth/resend-otp
 * @description Resend OTP to phone number
 * @body { phone }
 */
router.post('/resend-otp', (req, res, next) => {
  const schema = require('joi').object({
    phone: require('joi').string().pattern(/^\+?1?\d{9,15}$/).required(),
  });
  validate(schema)(req, res, next);
}, resendOTP);

/**
 * @route POST /api/auth/login
 * @description Login with phone and password
 * @body { phone, password }
 */
router.post('/login', validate(loginSchema), login);

/**
 * @route GET /api/auth/profile
 * @description Get current user profile
 * @auth required
 */
router.get('/profile', authMiddleware, getProfile);

/**
 * @route POST /api/auth/logout
 * @description Logout current user
 * @auth required
 */
router.post('/logout', authMiddleware, logout);

module.exports = router;
