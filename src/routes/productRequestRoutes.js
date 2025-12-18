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
router.get("/mine", protect, getUserProductRequests);

// Admin routes
router.get("/", protect, authorizeAdmin, getAllProductRequests);
router.patch("/:id/reply", protect, authorizeAdmin, replyToProductRequest);
router.delete("/:id", protect, authorizeAdmin, deleteProductRequest);

export default router;