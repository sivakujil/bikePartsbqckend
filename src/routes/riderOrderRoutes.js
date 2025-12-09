import express from 'express';
import { protect, authorizeRider } from '../middlewares/authmiddleware.js';
import {
  getAssignedOrders,
  getOrderDetails,
  pickupOrder,
  startDelivery,
  deliverOrder,
  cancelOrder,
  getOrderHistory,
  validatePickup,
  validateDelivery,
  validateCancel
} from '../controllers/riderOrderController.js';
import {
  getRiderProfile,
  updateRiderOnlineStatus,
  getRiderStats
} from '../controllers/riderController.js';

const router = express.Router();

// All routes require rider authentication
router.use(protect);
router.use(authorizeRider);

// Get rider profile
router.get('/profile', getRiderProfile);

// Update rider online status
router.put('/status', updateRiderOnlineStatus);

// Get rider statistics
router.get('/stats', getRiderStats);

// Get assigned orders (for frontend compatibility)
router.get('/orders', getAssignedOrders);

// Get assigned orders
router.get('/orders/assigned', getAssignedOrders);

// Get order details
router.get('/orders/:id', getOrderDetails);

// Pickup order
router.post('/orders/:id/pickup', validatePickup, pickupOrder);

// Start delivery
router.post('/orders/:id/start', startDelivery);

// Deliver order
router.post('/orders/:id/deliver', validateDelivery, deliverOrder);

// Cancel order
router.post('/orders/:id/cancel', validateCancel, cancelOrder);

// Get order history
router.get('/orders/history', getOrderHistory);

export default router;