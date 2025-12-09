import Rider from '../Models/Rider.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { body, validationResult } from 'express-validator';
import logger from '../Utils/logger.js';

// Mask phone number for logging
const maskPhoneNumber = (phone) => {
  if (phone.length <= 4) return '***';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
};

// Generate OTP
const generateOTP = () => {
  return crypto.randomInt(100000, 999999).toString();
};

// Generate rider ID
const generateRiderId = () => {
  return `RDR${Date.now().toString().slice(-6)}${crypto.randomInt(10, 99)}`;
};

// Create email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

// Validation rules
export const validateRegister = [
  body('name').trim().isLength({ min: 2, max: 50 }).withMessage('Name must be 2-50 characters'),
  body('phone').isMobilePhone().withMessage('Valid phone number required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('vehicleType').isIn(['bike', 'scooter', 'car', 'van']).withMessage('Invalid vehicle type')
];

export const validateLogin = [
  body('phone').isMobilePhone().withMessage('Valid phone number required'),
  body('password').exists().withMessage('Password is required')
];

// Register rider
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, phone, password, vehicleType } = req.body;

    // Check if rider already exists
    const existingRider = await Rider.findOne({ phone });
    if (existingRider) {
      return res.status(400).json({ message: 'Rider with this phone number already exists' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create rider
    const rider = new Rider({
      name,
      phone,
      passwordHash,
      riderId: generateRiderId(),
      vehicleType
    });

    await rider.save();

    // Generate tokens
    const accessToken = jwt.sign(
      { riderId: rider._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { riderId: rider._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Rider registered successfully',
      rider: {
        id: rider._id,
        name: rider.name,
        phone: rider.phone,
        riderId: rider.riderId,
        vehicleType: rider.vehicleType
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
};

// Login rider
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { phone, password } = req.body;

    // Find rider
    const rider = await Rider.findOne({ phone });
    if (!rider) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, rider.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if active
    if (!rider.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { riderId: rider._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { riderId: rider._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      accessToken,
      refreshToken,
      rider: {
        id: rider._id,
        name: rider.name,
        phone: rider.phone,
        riderId: rider.riderId,
        vehicleType: rider.vehicleType,
        walletBalance: rider.walletBalance
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
};

// Refresh token
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ message: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find rider
    const rider = await Rider.findById(decoded.riderId);
    if (!rider || !rider.isActive) {
      return res.status(401).json({ message: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { riderId: rider._id },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ message: 'Invalid refresh token' });
  }
};

// Forgot password - send OTP
export const forgotPassword = async (req, res) => {
  try {
    const { phone } = req.body;

    const rider = await Rider.findOne({ phone });
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Save OTP
    rider.otp = { code: otp, expiresAt };
    await rider.save();

    // Send OTP via SMS (mock implementation)
    // In production, integrate with SMS provider
    logger.info('OTP sent', { phone: maskPhoneNumber(phone), otpSent: true });

    // For demo, also send via email if available
    if (process.env.EMAIL_USER) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: `${phone}@sms.example.com`, // Mock SMS to email
        subject: 'Password Reset OTP',
        text: `Your OTP for password reset is: ${otp}. Valid for 10 minutes.`
      });
    }

    res.json({ message: 'OTP sent successfully' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Reset password with OTP
export const resetPassword = async (req, res) => {
  try {
    const { phone, otp, newPassword } = req.body;

    const rider = await Rider.findOne({ phone });
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    // Verify OTP
    if (!rider.otp || rider.otp.code !== otp || rider.otp.expiresAt < new Date()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password and clear OTP
    rider.passwordHash = passwordHash;
    rider.otp = undefined;
    await rider.save();

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};