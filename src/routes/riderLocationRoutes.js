import express from 'express';
import { protectRider } from '../middlewares/riderAuthMiddleware.js';
import { protect, authorizeAdmin } from '../middlewares/authmiddleware.js';
import {
  updateLocation,
  getLocationHistory,
  getAllRidersLocations,
  validateLocationUpdate
} from '../controllers/riderLocationController.js';

const router = express.Router();

// Rider location update
router.post('/location', protectRider, validateLocationUpdate, updateLocation);
router.get('/location/history', protectRider, getLocationHistory);

// Admin routes for monitoring all riders
router.get('/admin/locations', protect, authorizeAdmin, getAllRidersLocations);

export default router;