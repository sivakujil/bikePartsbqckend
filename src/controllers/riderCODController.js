import RiderOrder from '../Models/RiderOrder.js';
import Rider from '../Models/Rider.js';
import { body, validationResult } from 'express-validator';

// Update cash settlement status
export const updateCashSettlement = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { status } = req.body;
    const riderId = req.rider._id;

    const order = await RiderOrder.findOne({
      _id: id,
      assignedRider: riderId,
      status: 'delivered'
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not delivered' });
    }

    if (order.codAmount === 0) {
      return res.status(400).json({ message: 'Order has no COD amount' });
    }

    order.cashSettlementStatus = status;
    await order.save();

    res.json({
      message: 'Cash settlement status updated',
      order
    });
  } catch (error) {
    console.error('Update cash settlement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get COD summary for rider
export const getCODSummary = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const codOrders = await RiderOrder.find({
      assignedRider: riderId,
      codAmount: { $gt: 0 },
      status: 'delivered'
    });

    const totalCOD = codOrders.reduce((sum, order) => sum + order.codAmount, 0);
    const collectedCOD = codOrders.reduce((sum, order) => sum + (order.cashCollected || 0), 0);
    const pendingSettlement = codOrders.filter(order => order.cashSettlementStatus === 'pending').length;

    res.json({
      totalCOD,
      collectedCOD,
      pendingSettlement,
      orders: codOrders.map(order => ({
        id: order._id,
        orderId: order.orderId,
        codAmount: order.codAmount,
        cashCollected: order.cashCollected,
        settlementStatus: order.cashSettlementStatus,
        deliveredAt: order.deliveredAt
      }))
    });
  } catch (error) {
    console.error('Get COD summary error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Validation
export const validateSettlementUpdate = [
  body('status').isIn(['pending', 'settled']).withMessage('Invalid settlement status')
];