import express from 'express';
import { protectRider } from '../middlewares/riderAuthMiddleware.js';
import {
  getTodayEarnings,
  getEarningsHistory,
  getPayoutHistory,
  requestPayout,
  validatePayoutRequest
} from '../controllers/riderPayoutController.js';

const router = express.Router();

// All routes require rider authentication
router.use(protectRider);

// Earnings endpoints
router.get('/earnings/today', getTodayEarnings);
router.get('/earnings/history', getEarningsHistory);

// Payout endpoints
router.get('/payouts', getPayoutHistory);
router.post('/payouts/request', validatePayoutRequest, requestPayout);

export default router;