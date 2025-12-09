import express from "express";
import {
  createOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/ordercontrollers.js";
import { protect, authorizeAdmin } from "../middlewares/authmiddleware.js";

const router = express.Router();

router.post("/", protect, createOrder);
router.get("/my-orders", protect, getUserOrders);
router.get("/", protect, authorizeAdmin, getAllOrders);
router.put("/:id/status", protect, authorizeAdmin, updateOrderStatus);

export default router;
