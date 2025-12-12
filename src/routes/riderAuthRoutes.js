import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  register,
  login,
  refresh,
  forgotPassword,
  resetPassword,
  validateRegister,
  validateLogin
} from '../controllers/riderAuthController.js';

const router = express.Router();

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3, // 3 OTP requests per window
  message: 'Too many OTP requests, please try again later',
});

// Routes
router.post('/register', authLimiter, validateRegister, register);
router.post('/login', authLimiter, validateLogin, login);
router.post('/refresh', refresh);
router.post('/forgot-password', otpLimiter, forgotPassword);
router.post('/reset-password', resetPassword);

export default router;