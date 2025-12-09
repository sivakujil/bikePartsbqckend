// import express from "express";
// import {
//   getDashboardStats,
//   getSalesReport,
//   getAllUsers,
//   updateUserRole,
//   deleteUser
// } from "../controllers/adminController.js";
// import { getAllOrders, updateOrderStatus } from "../controllers/ordercontrollers.js";
// import { protect, authorizeAdmin } from "../middlewares/authmiddleware.js";

// const router = express.Router();

// // Apply authentication and admin authorization to all routes
// router.use(protect);
// router.use(authorizeAdmin);

// // Dashboard routes
// router.get("/dashboard/stats", getDashboardStats);

// // Reports routes
// router.get("/reports/sales", getSalesReport);

// // User management routes
// router.get("/users", getAllUsers);
// router.put("/users/:id/role", updateUserRole);
// router.delete("/users/:id", deleteUser);

// // Order management routes
// router.get("/orders", getAllOrders);
// router.put("/orders/:id/status", updateOrderStatus);

// // Customers route (same as users for now)
// router.get("/customers", getAllUsers);

// export default router;


import express from "express";
import {
  getDashboardStats,
  getSalesReport,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllRiders,
  updateRiderStatus,
  sendMessageToRider,
  createUser,
  updateUser,
  updateUserStatus,
  getSettings,
  updateSettings,
  updatePaymentGateway,
  markOrderAsPaid,
  assignRiderToOrder
} from "../controllers/adminController.js";

import {
  getAllOrders,
  updateOrderStatus
} from "../controllers/ordercontrollers.js";

import {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct
} from "../controllers/productcontrollers.js";  // ✅ FIXED

import { protect, authorizeAdmin } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Authentication
router.use(protect);
router.use(authorizeAdmin);

// Dashboard
router.get("/dashboard/stats", getDashboardStats);

// Reports
router.get("/reports/sales", getSalesReport);

// Users
router.post("/users", createUser);
router.get("/users", getAllUsers);
router.put("/users/:id", updateUser);
router.put("/users/:id/role", updateUserRole);
router.put("/users/:id/status", updateUserStatus);
router.delete("/users/:id", deleteUser);

// Orders
router.get("/orders", getAllOrders);
router.put("/orders/:id/status", updateOrderStatus);
router.patch("/orders/:id/mark-paid", markOrderAsPaid);

// Products
// Product Management
router.post("/products", createProduct);        // Add Product
router.put("/products/:id", updateProduct);     // Edit Product
router.delete("/products/:id", deleteProduct);  // Delete Product
router.get("/products", getProducts);           // View All
router.get("/products/:id", getProductById);    // View Single


// Customers
router.get("/customers", getAllUsers);

// Riders
router.post("/riders", createUser); // Create rider using createUser with role=rider
router.get("/riders", getAllRiders);
router.put("/riders/:id/status", updateRiderStatus);
router.post("/riders/:id/message", sendMessageToRider);

// Order Assignment
router.post("/orders/assign-rider", assignRiderToOrder);

// Settings
router.get("/settings", getSettings);
router.put("/settings", updateSettings);
router.put("/settings/payment-gateways/:id", updatePaymentGateway);

export default router;
