import express from "express";
import {
  createProductRequest,
  getAllProductRequests,
  getUserProductRequests,
  replyToProductRequest
} from "../controllers/productRequestController.js";
import { protect, authorizeAdmin } from "../middlewares/authmiddleware.js";

const router = express.Router();

// User routes
router.post("/create", protect, createProductRequest);
router.get("/user", protect, getUserProductRequests);

// Admin routes
router.get("/admin", protect, authorizeAdmin, getAllProductRequests);
router.put("/reply/:id", protect, authorizeAdmin, replyToProductRequest);

export default router;