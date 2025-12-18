import express from "express";
import {
  createProductRequest,
  getAllProductRequests,
  getUserProductRequests,
  replyToProductRequest,
  deleteProductRequest
} from "../controllers/productRequestController.js";
import { protect, authorizeAdmin } from "../middlewares/authmiddleware.js";

const router = express.Router();

// User routes
router.post("/", protect, createProductRequest);
router.get("/my", protect, getUserProductRequests);

// Admin routes
router.get("/admin", protect, authorizeAdmin, getAllProductRequests);
router.put("/reply/:id", protect, authorizeAdmin, replyToProductRequest);
router.delete("/:id", protect, authorizeAdmin, deleteProductRequest);

export default router;