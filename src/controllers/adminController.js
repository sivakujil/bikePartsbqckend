import User from "../Models/User.js";
import Order from "../Models/order.js";
import Product from "../Models/Product.js";
import RiderOrder from "../Models/RiderOrder.js";
import Rider from "../Models/Rider.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
// import { generateOrderOTPs } from "../Utils/otp.js";

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalOrders = await Order.countDocuments();
    const totalProducts = await Product.countDocuments();
    
    // Calculate total revenue
    const orders = await Order.find({ status: "completed" });
    const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
    
    // Get recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'name email');
    
    // Get top products
    const topProducts = await Product.find()
      .sort({ sales: -1 })
      .limit(5);

    res.json({
      totalUsers,
      totalOrders,
      totalProducts,
      totalRevenue,
      recentOrders,
      topProducts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get sales report
export const getSalesReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let matchStage = {};
    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }
    
    const salesData = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
            day: { $dayOfMonth: "$createdAt" }
          },
          totalSales: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } }
    ]);
    
    // Get orders by status
    const ordersByStatus = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    res.json({
      salesData,
      ordersByStatus
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select('-passwordHash')
      .sort({ createdAt: -1 });
    
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select('-passwordHash');
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json({
      message: "User role updated successfully",
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all riders
export const getAllRiders = async (req, res) => {
  try {
    const riders = await User.find({ role: "rider" })
      .select('-passwordHash')
      .sort({ createdAt: -1 });

    res.json(riders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update rider online status
export const updateRiderStatus = async (req, res) => {
  try {
    const { isOnline } = req.body;
    const rider = await User.findByIdAndUpdate(
      req.params.id,
      { isOnline },
      { new: true }
    ).select('-passwordHash');

    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    res.json({
      message: "Rider status updated successfully",
      rider
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Send message to rider (placeholder - could integrate with chat system)
export const sendMessageToRider = async (req, res) => {
  try {
    const { message } = req.body;
    const rider = await User.findById(req.params.id);

    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    // For now, just log the message. In a real app, you'd save to a messages collection or use a chat service
    console.log(`Message to rider ${rider.name} (${rider._id}): ${message}`);

    res.json({ message: "Message sent successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new user
export const createUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      permissions,
      phone,
      vehicleType,
      vehicleNumber,
      licenseNumber
    } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required" });
    }

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: "User with this email already exists" });
    }

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const userData = {
      name,
      email: normalizedEmail,
      passwordHash,
      role: role || "user",
      permissions: permissions || []
    };

    // Add rider-specific fields if role is rider
    if (role === "rider") {
      userData.phone = phone;
      userData.vehicleType = vehicleType;
      userData.vehicleNumber = vehicleNumber;
      userData.licenseNumber = licenseNumber;
      userData.isOnline = false;
      userData.rating = 5.0;
      userData.assignedOrders = [];
    }

    const user = await User.create(userData);

    res.status(201).json({
      message: "User created successfully",
      user: { ...user.toObject(), passwordHash: undefined }
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user
export const updateUser = async (req, res) => {
  try {
    const { name, email, role, permissions } = req.body;
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { name, email: normalizedEmail, role, permissions },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User updated successfully",
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update user status (active/inactive)
export const updateUserStatus = async (req, res) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    ).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "User status updated successfully",
      user
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get settings
export const getSettings = async (req, res) => {
  try {
    // For now, return mock settings. In a real app, you'd have a Settings model
    const settings = {
      deliveryZones: [
        { id: 1, name: "Central Colombo", fee: 150, estimatedTime: "30-45 min" },
        { id: 2, name: "Suburbs", fee: 200, estimatedTime: "45-60 min" },
        { id: 3, name: "Outer Areas", fee: 300, estimatedTime: "60-90 min" },
      ],
      shippingFees: [
        { type: "Standard", cost: 100, freeAbove: 1000 },
        { type: "Express", cost: 200, freeAbove: 500 },
        { type: "Same Day", cost: 300, freeAbove: 250 },
      ],
      paymentGateways: [
        { id: "stripe", name: "Stripe", enabled: true, type: "card" },
        { id: "paypal", name: "PayPal", enabled: true, type: "wallet" },
        { id: "cod", name: "Cash on Delivery", enabled: true, type: "cash" },
      ],
      notificationSettings: {
        email: true,
        sms: false,
        push: true,
        orderUpdates: true,
        lowStockAlerts: true,
        riderMessages: false,
      }
    };

    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update settings
export const updateSettings = async (req, res) => {
  try {
    const { deliveryZones, shippingFees, paymentGateways, notificationSettings } = req.body;

    // For now, just log and return success. In a real app, save to database
    console.log("Updating settings:", { deliveryZones, shippingFees, paymentGateways, notificationSettings });

    res.json({ message: "Settings updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update payment gateway
export const updatePaymentGateway = async (req, res) => {
  try {
    const { enabled } = req.body;

    // For now, just log and return success
    console.log(`Updating payment gateway ${req.params.id}: enabled=${enabled}`);

    res.json({ message: "Payment gateway updated successfully" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Assign rider to order
export const assignRiderToOrder = async (req, res) => {
  try {
    const { orderId, riderId } = req.body;

    // Validate input
    if (!orderId || !riderId) {
      return res.status(400).json({ message: "Order ID and Rider ID are required" });
    }

    // Find the order
    const order = await Order.findById(orderId).populate('userId', 'name email phone');
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order is eligible for assignment
    if (order.status !== 'confirmed' && order.status !== 'processing') {
      return res.status(400).json({ message: "Order is not in a state that can be assigned to a rider" });
    }

    // Find the rider
    const rider = await Rider.findById(riderId);
    if (!rider) {
      return res.status(404).json({ message: "Rider not found" });
    }

    if (!rider.isActive) {
      return res.status(400).json({ message: "Rider is not active" });
    }

    // Check if rider already has an active order
    if (rider.currentOrder) {
      return res.status(400).json({ message: "Rider already has an active order" });
    }

    // Generate OTPs
    const { pickup: pickupOtp, delivery: deliveryOtp } = generateOrderOTPs();

    // Create rider order
    const riderOrderData = {
      orderId: order._id.toString(),
      items: order.items.map(item => ({
        name: item.productId?.name || 'Unknown Product',
        quantity: item.quantity,
        price: item.price
      })),
      pickup: {
        name: 'Store Location', // You might want to get this from a store model
        address: '123 Main St, Colombo', // Replace with actual store address
        lat: 6.9271, // Colombo coordinates
        lng: 79.8612,
        phone: '+94123456789' // Store phone
      },
      delivery: {
        name: order.userId?.name || 'Customer',
        address: order.shippingAddress?.street + ', ' + order.shippingAddress?.city || 'Customer Address',
        lat: order.shippingAddress?.lat || 6.9271,
        lng: order.shippingAddress?.lng || 79.8612,
        phone: order.userId?.phone || 'N/A'
      },
      codAmount: order.paymentMethod === 'COD' ? order.totalAmount : 0,
      assignedRider: rider._id,
      otpPickup: pickupOtp,
      otpDelivery: deliveryOtp
    };

    const riderOrder = await RiderOrder.create(riderOrderData);

    // Update rider's current order
    rider.currentOrder = riderOrder._id;
    await rider.save();

    // Update order status
    order.status = 'assigned';
    order.assignedRider = rider._id;
    await order.save();

    res.json({
      message: "Order assigned to rider successfully",
      riderOrder,
      rider: {
        _id: rider._id,
        name: rider.name,
        phone: rider.phone
      }
    });
  } catch (err) {
    console.error('Assign rider error:', err);
    res.status(500).json({ message: err.message });
  }
};

// Mark COD order as paid
export const markOrderAsPaid = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.paymentMethod !== "COD") {
      return res.status(400).json({ message: "Only COD orders can be marked as paid" });
    }

    if (order.paymentStatus === "Paid") {
      return res.status(400).json({ message: "Order is already marked as paid" });
    }

    // Update payment status and order status
    order.paymentStatus = "Paid";
    order.status = "Completed";
    await order.save();

    res.json({
      message: "Order marked as paid successfully",
      order
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
