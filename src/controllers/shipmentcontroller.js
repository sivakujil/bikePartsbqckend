import Shipment from "../Models/shipment.js";
import Order from "../Models/order.js";

// CREATE SHIPMENT
export const createShipment = async (req, res) => {
  try {
    const { order_id, courier, assigned_driver_id } = req.body;

    // Validate order exists
    const order = await Order.findById(order_id);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const tracking_number = req.body.tracking_number || `TRK${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const shipment = await Shipment.create({
      order_id,
      courier: courier || "Standard Delivery",
      tracking_number,
      assigned_driver_id: assigned_driver_id || null,
      status: "Pending"
    });

    // Update order with shipment reference
    await Order.findByIdAndUpdate(order_id, { 
      shipment_id: shipment._id,
      status: "Shipped"
    });

    const populatedShipment = await Shipment.findById(shipment._id)
      .populate('order_id')
      .populate('assigned_driver_id', 'name email');

    res.status(201).json(populatedShipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL SHIPMENTS (Admin)
export const getAllShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find()
      .populate('order_id')
      .populate('assigned_driver_id', 'name email')
      .sort({ createdAt: -1 });
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET USER SHIPMENTS (Customer)
export const getUserShipments = async (req, res) => {
  try {
    // Find orders belonging to the user, then get their shipments
    const userOrders = await Order.find({ user_id: req.user._id });
    const orderIds = userOrders.map(order => order._id);
    
    const shipments = await Shipment.find({ order_id: { $in: orderIds } })
      .populate('order_id')
      .populate('assigned_driver_id', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET DRIVER SHIPMENTS
export const getDriverShipments = async (req, res) => {
  try {
    const shipments = await Shipment.find({ assigned_driver_id: req.user._id })
      .populate('order_id')
      .sort({ createdAt: -1 });
    res.json(shipments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET SHIPMENT BY ID
export const getShipmentById = async (req, res) => {
  try {
    const shipment = await Shipment.findById(req.params.id)
      .populate('order_id')
      .populate('assigned_driver_id', 'name email');
    
    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    // Check if user has permission to view this shipment
    const order = shipment.order_id;
    if (order.user_id.toString() !== req.user._id.toString() && 
        shipment.assigned_driver_id?.toString() !== req.user._id.toString() &&
        req.user.role !== 'admin') {
      return res.status(403).json({ message: "Not authorized to view this shipment" });
    }

    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE STATUS
export const updateShipmentStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Pending", "Picked_up", "In_transit", "Shipped", "Delivered", "Cancelled"];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id, 
      { status }, 
      { new: true }
    ).populate('order_id');

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    // Update order status based on shipment status
    let orderStatus = "Processing";
    switch (status) {
      case "Picked_up":
        orderStatus = "Out for Delivery";
        break;
      case "In_transit":
        orderStatus = "In Transit";
        break;
      case "Delivered":
        orderStatus = "Completed";
        break;
      case "Cancelled":
        orderStatus = "Cancelled";
        break;
      default:
        orderStatus = "Processing";
    }

    await Order.findByIdAndUpdate(shipment.order_id._id, { status: orderStatus });

    const populatedShipment = await Shipment.findById(shipment._id)
      .populate('order_id')
      .populate('assigned_driver_id', 'name email');

    res.json(populatedShipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ASSIGN DRIVER
export const assignDriver = async (req, res) => {
  try {
    const { driver_id } = req.body;
    
    const shipment = await Shipment.findByIdAndUpdate(
      req.params.id,
      { assigned_driver_id: driver_id },
      { new: true }
    ).populate('order_id').populate('assigned_driver_id', 'name email');

    if (!shipment) {
      return res.status(404).json({ message: "Shipment not found" });
    }

    res.json(shipment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
