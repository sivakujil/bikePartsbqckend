import express from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCurrentOrder,
  createOrderFromCart,
  updateOrderTotals,
  getUserOrders,
  getOrderById,
  cancelOrder,
} from "../controllers/cartOrderController.js";
import { protect } from "../middlewares/authmiddleware.js";

const router = express.Router();

// ============ CART ROUTES ============

// GET user's cart
router.get("/", protect, getCart);

// ADD item to cart
router.post("/add", protect, addToCart);

// UPDATE cart item quantity
router.put("/update", protect, updateCartItem);

// REMOVE item from cart
router.delete("/remove", protect, removeFromCart);

// CLEAR cart
router.delete("/clear", protect, clearCart);

// ============ ORDER ROUTES ============

// GET current pending order
router.get("/order/current", protect, getCurrentOrder);

// CREATE order from cart
router.post("/order/create", protect, createOrderFromCart);

// UPDATE order totals
router.put("/order/:orderId/totals", protect, updateOrderTotals);

// GET all user's orders
router.get("/orders", protect, getUserOrders);

// GET single order
router.get("/order/:orderId", protect, getOrderById);

// CANCEL order
router.delete("/order/:orderId/cancel", protect, cancelOrder);

export default router;
