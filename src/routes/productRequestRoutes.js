import express from "express";
import {
  createProductRequest,
  getAllProductRequests,
  updateProductRequestStatus,
  deleteProductRequest
} from "../controllers/productRequestController.js";
import { protect, authorizeAdmin } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Public route - anyone can submit a product request
router.post("/", createProductRequest);

// Admin-only routes
router.get("/", protect, authorizeAdmin, getAllProductRequests);
router.put("/:id/status", protect, authorizeAdmin, updateProductRequestStatus);
router.delete("/:id", protect, authorizeAdmin, deleteProductRequest);

export default router;