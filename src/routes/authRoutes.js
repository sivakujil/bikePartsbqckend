import express from "express";
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  updateProfile,
  createAdmin // ✅ Make sure this is exported from authcontrollers.js
} from "../controllers/authcontrollers.js";
import { protect, authorizeAdmin } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/create-admin", createAdmin);

// Protected routes
router.get("/profile", protect, (req, res) => res.json(req.user));
router.put("/profile", protect, updateProfile);
router.get("/me", protect, (req, res) => res.json(req.user));

// Admin-only route
router.get("/admin", protect, authorizeAdmin, (req, res) => {
  res.json({ message: "Welcome, admin!" });
});

export default router;
