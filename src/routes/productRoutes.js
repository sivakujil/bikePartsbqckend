// import express from "express";
// import {
//   getProducts,
//   getProductById,
//   createProduct,
//   updateProduct,
//   deleteProduct,
// } from "../controllers/productcontrollers.js";
// import { protect, authorizeAdmin } from "../middlewares/authmiddleware.js";

// const router = express.Router();

// router.get("/", getProducts);
// router.get("/:id", getProductById);
// router.post("/", protect, authorizeAdmin, createProduct);
// router.put("/:id", protect, authorizeAdmin, updateProduct);
// router.delete("/:id", protect, authorizeAdmin, deleteProduct);

// export default router;



import express from "express";
import {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/productcontrollers.js";  // FIXED NAME

import { protect, authorizeAdmin } from "../middlewares/authmiddleware.js"; // FIXED NAME

const router = express.Router();

// ================================
// PUBLIC ROUTES
// ================================
router.get("/", getProducts);
router.get("/:id", getProductById);

// ================================
// ADMIN ROUTES
// ================================
router.post("/", protect, authorizeAdmin, createProduct);
router.put("/:id", protect, authorizeAdmin, updateProduct);
router.delete("/:id", protect, authorizeAdmin, deleteProduct);

export default router;
