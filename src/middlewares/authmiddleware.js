import jwt from "jsonwebtoken";
import User from "../Models/User.js";

// ================================
// PROTECT ROUTE (USER AUTH REQUIRED)
// ================================
export const protect = async (req, res, next) => {
  let token;

  // Get token from Authorization Header
  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res.status(401).json({ message: "Not authorized, token missing" });
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Find user without password
    req.user = await User.findById(decoded.id).select("-passwordHash");

    if (!req.user) {
      return res.status(404).json({ message: "User no longer exists" });
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

// ================================
// ADMIN ONLY ROUTE
// ================================
export const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ message: "Admin access denied" });
  }
  next();
};

// ================================
// RIDER ONLY ROUTE
// ================================
export const authorizeRider = (req, res, next) => {
  if (!req.user || req.user.role !== "rider") {
    return res.status(403).json({ message: "Rider access denied" });
  }
  next();
};
