import express from "express";
import { 
  createShipment, 
  getAllShipments, 
  getUserShipments, 
  getDriverShipments,
  getShipmentById,
  updateShipmentStatus,
  assignDriver 
} from "../controllers/shipmentcontroller.js";
import { protect, authorizeAdmin } from "../middlewares/authmiddleware.js";

const router = express.Router();

// Admin routes
router.post("/", protect, authorizeAdmin, createShipment);
router.get("/all", protect, authorizeAdmin, getAllShipments);
router.put("/:id/assign-driver", protect, authorizeAdmin, assignDriver);

// Driver routes
router.get("/driver", protect, getDriverShipments);

// Customer routes
router.get("/my-shipments", protect, getUserShipments);

// Common routes
router.get("/:id", protect, getShipmentById);
router.put("/:id/status", protect, updateShipmentStatus);

export default router;
