import express from 'express';
import {
  authenticateRider,
  getRiderOrders,
  pickupOrder,
  deliverOrder,
  uploadProof,
  updateOrderStatus,
  getRiderProfile,
  updateRiderProfile,
  getRiderStats
} from '../controllers/riderController.js';

const router = express.Router();

// Apply authentication middleware to all rider routes
router.use(authenticateRider);

// Rider Profile Routes
router.get('/profile', getRiderProfile);
router.put('/profile', updateRiderProfile);

// Rider Orders Routes
router.get('/orders', getRiderOrders);
router.put('/order/pickup/:id', pickupOrder);
router.put('/order/deliver/:id', deliverOrder);
router.put('/order/status/:id', updateOrderStatus);
router.post('/order/upload-proof', uploadProof);

// Rider Statistics
router.get('/stats', getRiderStats);

export default router;