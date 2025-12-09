import jwt from 'jsonwebtoken';
import Rider from '../Models/Rider.js';

// Protect rider routes
export const protectRider = async (req, res, next) => {
  let token;

  // Get token from Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, token missing' });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find rider
    req.rider = await Rider.findById(decoded.riderId).select('-passwordHash -otp');

    if (!req.rider) {
      return res.status(404).json({ message: 'Rider no longer exists' });
    }

    if (!req.rider.isActive) {
      return res.status(403).json({ message: 'Account is deactivated' });
    }

    next();
  } catch (err) {
    console.error('Token verification error:', err);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

// Optional rider auth (for routes that work with or without auth)
export const optionalRiderAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.rider = await Rider.findById(decoded.riderId).select('-passwordHash -otp');
    } catch (err) {
      // Ignore token errors for optional auth
    }
  }

  next();
};