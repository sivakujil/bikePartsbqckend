import Issue from '../Models/Issue.js';
import RiderOrder from '../Models/RiderOrder.js';
import { body, validationResult } from 'express-validator';
import logger from '../Utils/logger.js';

// Report an issue with an order
export const reportIssue = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { type, message, images } = req.body;
    const riderId = req.rider._id;

    // Verify order exists and belongs to rider
    const order = await RiderOrder.findOne({
      _id: id,
      assignedRider: riderId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Create issue
    const issue = new Issue({
      orderId: order.orderId,
      riderId,
      type,
      message,
      images: images || []
    });

    await issue.save();

    // Log for admin notification (in production, send email/SMS)
    logger.info('Issue reported', {
      issueType: type,
      orderId: order.orderId,
      riderId: req.rider.riderId,
      riderName: req.rider.name
    });

    res.status(201).json({
      message: 'Issue reported successfully',
      issue
    });
  } catch (error) {
    console.error('Report issue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get rider's issues
export const getRiderIssues = async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const riderId = req.rider._id;

    let filter = { riderId };
    if (status) {
      filter.status = status;
    }

    const issues = await Issue.find(filter)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Issue.countDocuments(filter);

    res.json({
      issues,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get rider issues error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get issue details
export const getIssueDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const riderId = req.rider._id;

    const issue = await Issue.findOne({
      _id: id,
      riderId
    });

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    res.json(issue);
  } catch (error) {
    console.error('Get issue details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update issue (add follow-up message)
export const updateIssue = async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const riderId = req.rider._id;

    const issue = await Issue.findOne({
      _id: id,
      riderId
    });

    if (!issue) {
      return res.status(404).json({ message: 'Issue not found' });
    }

    // Append to message
    issue.message += `\n\n[Follow-up]: ${message}`;
    await issue.save();

    res.json({
      message: 'Issue updated successfully',
      issue
    });
  } catch (error) {
    console.error('Update issue error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validation
export const validateIssueReport = [
  body('type').isIn(['wrong_address', 'customer_not_available', 'damaged_package', 'wrong_item', 'payment_issue', 'other']).withMessage('Invalid issue type'),
  body('message').trim().isLength({ min: 10, max: 500 }).withMessage('Message must be 10-500 characters'),
  body('images').optional().isArray().withMessage('Images must be an array'),
  body('images.*').optional().isURL().withMessage('Invalid image URL')
];

export const validateIssueUpdate = [
  body('message').trim().isLength({ min: 5 }).withMessage('Follow-up message is required')
];