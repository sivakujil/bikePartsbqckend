import express from 'express';
import { protectRider } from '../middlewares/riderAuthMiddleware.js';
import {
  updateCashSettlement,
  getCODSummary,
  validateSettlementUpdate
} from '../controllers/riderCODController.js';

const router = express.Router();

// All routes require rider authentication
router.use(protectRider);

// Update cash settlement status
router.put('/orders/:id/settlement', validateSettlementUpdate, updateCashSettlement);

// Get COD summary
router.get('/cod/summary', getCODSummary);

export default router;