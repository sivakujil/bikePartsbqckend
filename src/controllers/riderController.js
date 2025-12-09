import Rider from '../Models/Rider.js';
import RiderOrder from '../Models/RiderOrder.js';
import Order from '../Models/order.js';
import jwt from 'jsonwebtoken';
import cloudinary from 'cloudinary';
import multer from 'multer';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Middleware to verify rider JWT token
export const authenticateRider = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const rider = await Rider.findById(decoded.riderId);

    if (!rider || !rider.isActive) {
      return res.status(401).json({ message: 'Invalid token or rider not active' });
    }

    req.rider = rider;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// GET /rider/orders - Get all orders assigned to rider
export const getRiderOrders = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const orders = await RiderOrder.find({
      assignedRider: riderId
    })
    .populate('assignedRider', 'name phone riderId')
    .sort({ createdAt: -1 });

    // Categorize orders
    const categorizedOrders = {
      new: orders.filter(order => order.status === 'assigned'),
      pending: orders.filter(order => ['picked_up', 'out_for_delivery'].includes(order.status)),
      completed: orders.filter(order => order.status === 'delivered')
    };

    res.json({
      success: true,
      data: categorizedOrders
    });
  } catch (error) {
    console.error('Error fetching rider orders:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /rider/order/pickup/:id - Mark order as picked up
export const pickupOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const riderId = req.rider._id;

    const order = await RiderOrder.findOne({
      _id: id,
      assignedRider: riderId,
      status: 'assigned'
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not assigned to you' });
    }

    // Update order status
    order.status = 'picked_up';
    order.pickupTime = new Date();
    await order.save();

    res.json({
      success: true,
      message: 'Order marked as picked up successfully',
      data: order
    });
  } catch (error) {
    console.error('Error picking up order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /rider/order/deliver/:id - Mark order as delivered
export const deliverOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { otp, cashCollected } = req.body;
    const riderId = req.rider._id;

    const order = await RiderOrder.findOne({
      _id: id,
      assignedRider: riderId,
      status: { $in: ['picked_up', 'out_for_delivery'] }
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found or not in deliverable status' });
    }

    // Verify OTP if required
    if (order.otpDelivery && order.otpDelivery !== otp) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // Update order status
    order.status = 'delivered';
    order.deliveredAt = new Date();
    if (cashCollected !== undefined) {
      order.cashCollected = cashCollected;
      order.cashSettlementStatus = 'pending';
    }
    await order.save();

    // Update rider earnings
    const rider = await Rider.findById(riderId);
    if (rider) {
      rider.totalDeliveries += 1;
      // Add earning record
      rider.earnings.push({
        orderId: order.orderId,
        amount: order.codAmount || 0,
        type: 'delivery'
      });
      await rider.save();
    }

    res.json({
      success: true,
      message: 'Order delivered successfully',
      data: order
    });
  } catch (error) {
    console.error('Error delivering order:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// POST /rider/order/upload-proof - Upload delivery proof image
export const uploadProof = [
  upload.single('proof'),
  async (req, res) => {
    try {
      const { orderId } = req.body;
      const riderId = req.rider._id;

      if (!req.file) {
        return res.status(400).json({ message: 'No image file provided' });
      }

      const order = await RiderOrder.findOne({
        _id: orderId,
        assignedRider: riderId
      });

      if (!order) {
        return res.status(404).json({ message: 'Order not found' });
      }

      // Upload to Cloudinary
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.v2.uploader.upload_stream(
          {
            folder: 'delivery-proofs',
            public_id: `proof_${orderId}_${Date.now()}`,
            transformation: [
              { width: 800, height: 600, crop: 'limit' },
              { quality: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        uploadStream.end(req.file.buffer);
      });

      // Save proof URL to order
      order.photos.push(result.secure_url);
      await order.save();

      res.json({
        success: true,
        message: 'Proof uploaded successfully',
        data: {
          proofUrl: result.secure_url,
          publicId: result.public_id
        }
      });
    } catch (error) {
      console.error('Error uploading proof:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
  }
];

// PUT /rider/order/status/:id - Update order status (for status flow)
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const riderId = req.rider._id;

    const validStatuses = ['assigned', 'picked_up', 'out_for_delivery', 'delivered'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const order = await RiderOrder.findOne({
      _id: id,
      assignedRider: riderId
    });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Validate status transition
    const currentStatus = order.status;
    const validTransitions = {
      'assigned': ['picked_up'],
      'picked_up': ['out_for_delivery'],
      'out_for_delivery': ['delivered'],
      'delivered': [] // Cannot change from delivered
    };

    if (!validTransitions[currentStatus]?.includes(status)) {
      return res.status(400).json({
        message: `Cannot change status from ${currentStatus} to ${status}`
      });
    }

    // Update status and timestamps
    order.status = status;
    if (status === 'picked_up' && !order.pickupTime) {
      order.pickupTime = new Date();
    } else if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date();
    }

    await order.save();

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: order
    });
  } catch (error) {
    console.error('Error updating order status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /rider/profile - Get rider profile
export const getRiderProfile = async (req, res) => {
  try {
    const rider = await Rider.findById(req.rider._id).select('-passwordHash -otp');
    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.json({
      success: true,
      data: rider
    });
  } catch (error) {
    console.error('Error fetching rider profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// PUT /rider/profile - Update rider profile
export const updateRiderProfile = async (req, res) => {
  try {
    const { name, phone, vehicleType } = req.body;
    const riderId = req.rider._id;

    const updateData = {};
    if (name) updateData.name = name;
    if (phone) updateData.phone = phone;
    if (vehicleType) updateData.vehicleType = vehicleType;

    const rider = await Rider.findByIdAndUpdate(
      riderId,
      updateData,
      { new: true, select: '-passwordHash -otp' }
    );

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: rider
    });
  } catch (error) {
    console.error('Error updating rider profile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// GET /rider/stats - Get rider statistics
export const getRiderStats = async (req, res) => {
  try {
    const riderId = req.rider._id;

    const [
      totalOrders,
      completedOrders,
      todayOrders,
      rider
    ] = await Promise.all([
      RiderOrder.countDocuments({ assignedRider: riderId }),
      RiderOrder.countDocuments({ assignedRider: riderId, status: 'delivered' }),
      RiderOrder.countDocuments({
        assignedRider: riderId,
        status: 'delivered',
        deliveredAt: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0)),
          $lt: new Date(new Date().setHours(23, 59, 59, 999))
        }
      }),
      Rider.findById(riderId).select('rating totalDeliveries earnings walletBalance')
    ]);

    const totalEarnings = rider?.earnings?.reduce((sum, earning) => sum + earning.amount, 0) || 0;

    res.json({
      success: true,
      data: {
        totalOrders,
        completedOrders,
        todayDeliveries: todayOrders,
        rating: rider?.rating || 0,
        totalDeliveries: rider?.totalDeliveries || 0,
        totalEarnings,
        walletBalance: rider?.walletBalance || 0
      }
    });
  } catch (error) {
   console.error('Error fetching rider stats:', error);
   res.status(500).json({ message: 'Server error', error: error.message });
  }
};
// PUT /rider/online-status - Update rider online status
export const updateRiderOnlineStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const riderId = req.rider._id;

    const rider = await Rider.findByIdAndUpdate(
      riderId,
      { isOnline: Boolean(isOnline) },
      { new: true, select: '-passwordHash -otp' }
    );

    if (!rider) {
      return res.status(404).json({ message: 'Rider not found' });
    }

    res.json({
      success: true,
      message: 'Online status updated successfully',
      data: rider
    });
  } catch (error) {
    console.error('Error updating rider online status:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};