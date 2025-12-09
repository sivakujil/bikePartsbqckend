import Payout from '../Models/Payout.js';
import Rider from '../Models/Rider.js';
import { body, validationResult } from 'express-validator';

// Get rider earnings today
export const getTodayEarnings = async (req, res) => {
  try {
    const riderId = req.rider._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    const todayEarnings = rider.earnings.filter(earning =>
      earning.date >= today && earning.date < tomorrow
    );

    const totalToday = todayEarnings.reduce((sum, earning) => sum + earning.amount, 0);

    res.json({
      total: totalToday,
      earnings: todayEarnings,
      walletBalance: rider.walletBalance
    });
  } catch (error) {
    console.error('Get today earnings error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get earnings history
export const getEarningsHistory = async (req, res) => {
  try {
    const riderId = req.rider._id;
    const { from, to } = req.query;

    let startDate, endDate;

    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
      endDate.setHours(23, 59, 59, 999);
    } else {
      // Default to last 30 days
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
    }

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    const earningsInRange = rider.earnings.filter(earning =>
      earning.date >= startDate && earning.date <= endDate
    );

    const totalEarnings = earningsInRange.reduce((sum, earning) => sum + earning.amount, 0);

    res.json({
      total: totalEarnings,
      earnings: earningsInRange,
      period: { from: startDate, to: endDate }
    });
  } catch (error) {
    console.error('Get earnings history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get payout history
export const getPayoutHistory = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const payouts = await Payout.find({ riderId })
      .sort({ createdAt: -1 });

    res.json(payouts);
  } catch (error) {
    console.error('Get payout history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Request payout
export const requestPayout = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const riderId = req.rider._id;
    const { amount, payoutMethod, bankDetails } = req.body;

    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    if (rider.walletBalance < amount) {
      return res.status(400).json({ message: 'Insufficient wallet balance' });
    }

    // Check minimum payout amount
    if (amount < 100) {
      return res.status(400).json({ message: 'Minimum payout amount is 100' });
    }

    // Create payout request
    const payout = new Payout({
      riderId,
      amount,
      payoutMethod,
      bankDetails
    });

    await payout.save();

    // Deduct from wallet (will be held until payout is processed)
    rider.walletBalance -= amount;
    await rider.save();

    res.status(201).json({
      message: 'Payout request submitted successfully',
      payout
    });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validation
export const validatePayoutRequest = [
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('payoutMethod').isIn(['bank_transfer', 'cash', 'wallet']).withMessage('Invalid payout method'),
  body('bankDetails.accountNumber').if(body('payoutMethod').equals('bank_transfer')).notEmpty().withMessage('Account number required'),
  body('bankDetails.bankName').if(body('payoutMethod').equals('bank_transfer')).notEmpty().withMessage('Bank name required'),
  body('bankDetails.accountHolderName').if(body('payoutMethod').equals('bank_transfer')).notEmpty().withMessage('Account holder name required')
];