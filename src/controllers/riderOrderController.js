import Order from '../Models/order.js';
import User from '../Models/User.js';
import RiderOrder from '../Models/RiderOrder.js';
import Rider from '../Models/Rider.js';
import { body, validationResult } from 'express-validator';

// Get assigned orders for rider
export const getAssignedOrders = async (req, res) => {
  try {
    const { status } = req.query;
    const riderId = req.user._id;

    let filter = { assignedRider: riderId };
    if (status === 'open') {
      filter.status = { $in: ['assigned', 'picked_up', 'out_for_delivery'] };
    } else if (status) {
      filter.status = status;
    }

    const orders = await RiderOrder.find(filter)
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (error) {
    console.error('Get assigned orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get order details
export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const riderId = req.user._id;

    const order = await RiderOrder.findOne({
      _id: id,
      assignedRider: riderId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    res.json(order);
  } catch (error) {
    console.error('Get order details error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Mark order as picked up
export const pickupOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { otp } = req.body;
    const riderId = req.user._id;

    const order = await RiderOrder.findOne({
      _id: id,
      assignedRider: riderId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'assigned') {
      return res.status(400).json({ message: 'Order is not in assigned status' });
    }

    // Verify pickup OTP
    if (order.otpPickup && order.otpPickup !== otp) {
      return res.status(400).json({ message: 'Invalid pickup OTP' });
    }

    // Update order
    order.status = 'picked_up';
    order.pickupTime = new Date();
    await order.save();

    res.json({
      message: 'Order picked up successfully',
      order
    });
  } catch (error) {
    console.error('Pickup order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Start delivery
export const startDelivery = async (req, res) => {
  try {
    const { id } = req.params;
    const riderId = req.user._id;

    const order = await RiderOrder.findOne({
      _id: id,
      assignedRider: riderId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'picked_up') {
      return res.status(400).json({ message: 'Order must be picked up first' });
    }

    order.status = 'out_for_delivery';
    await order.save();

    // Generate navigation link (Google Maps)
    const navigationLink = `https://maps.google.com/?q=${order.delivery.lat},${order.delivery.lng}`;

    res.json({
      message: 'Delivery started',
      order,
      navigationLink
    });
  } catch (error) {
    console.error('Start delivery error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Deliver order
export const deliverOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { otp, photoProofUrl, cashCollected } = req.body;
    const riderId = req.user._id;

    const order = await RiderOrder.findOne({
      _id: id,
      assignedRider: riderId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'out_for_delivery') {
      return res.status(400).json({ message: 'Order is not out for delivery' });
    }

    // Verify delivery OTP if required
    if (order.otpDelivery && order.otpDelivery !== otp) {
      return res.status(400).json({ message: 'Invalid delivery OTP' });
    }

    // Update order
    order.status = 'delivered';
    order.deliveredAt = new Date();

    if (photoProofUrl) {
      order.photos.push(photoProofUrl);
    }

    if (cashCollected !== undefined) {
      order.cashCollected = cashCollected;
      order.cashSettlementStatus = 'pending';
    }

    await order.save();

    // Update rider earnings
    const rider = await Rider.findById(riderId);
    if (rider) {
      // Calculate delivery fee (example: 10% of COD or fixed amount)
      const deliveryFee = order.codAmount * 0.1 || 50; // Default 50 if no COD

      rider.earnings.push({
        orderId: order.orderId,
        amount: deliveryFee,
        type: 'delivery'
      });

      rider.walletBalance += deliveryFee;
      await rider.save();
    }

    res.json({
      message: 'Order delivered successfully',
      order
    });
  } catch (error) {
    console.error('Deliver order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Cancel order
export const cancelOrder = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { reason } = req.body;
    const riderId = req.user._id;

    const order = await RiderOrder.findOne({
      _id: id,
      assignedRider: riderId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'delivered' || order.status === 'cancelled') {
      return res.status(400).json({ message: 'Order cannot be cancelled' });
    }

    order.status = 'cancelled';
    order.cancelledAt = new Date();
    order.cancelReason = reason;
    await order.save();

    res.json({
      message: 'Order cancelled successfully',
      order
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validation rules
export const validatePickup = [
  body('otp').optional().isLength({ min: 4, max: 6 }).withMessage('Invalid OTP format')
];

export const validateDelivery = [
  body('otp').optional().isLength({ min: 4, max: 6 }).withMessage('Invalid OTP format'),
  body('photoProofUrl').optional().isURL().withMessage('Invalid photo URL'),
  body('cashCollected').optional().isNumeric().withMessage('Cash collected must be a number')
];

export const validateCancel = [
  body('reason').trim().isLength({ min: 5 }).withMessage('Cancellation reason must be at least 5 characters')
];

// Get order history
export const getOrderHistory = async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const riderId = req.user._id;

    let filter = {
      assignedRider: riderId,
      status: { $in: ['delivered', 'cancelled'] }
    };

    if (status) {
      const statuses = status.split('|');
      filter.status = { $in: statuses };
    }

    const orders = await RiderOrder.find(filter)
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset))
      .select('-otpPickup -otpDelivery'); // Don't send OTPs in history

    const total = await RiderOrder.countDocuments(filter);

    res.json({
      orders,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Get order history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};