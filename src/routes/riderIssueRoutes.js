import express from 'express';
import { protectRider } from '../middlewares/riderAuthMiddleware.js';
import {
  reportIssue,
  getRiderIssues,
  getIssueDetails,
  updateIssue,
  validateIssueReport,
  validateIssueUpdate
} from '../controllers/riderIssueController.js';

const router = express.Router();

// All routes require rider authentication
router.use(protectRider);

// Report issue with order
router.post('/orders/:id/report', validateIssueReport, reportIssue);

// Get rider's issues
router.get('/issues', getRiderIssues);

// Get issue details
router.get('/issues/:id', getIssueDetails);

// Update issue (add follow-up)
router.put('/issues/:id', validateIssueUpdate, updateIssue);

export default router;