import Order from "../Models/order.js";
import Cart from "../Models/cart.js";

// CREATE ORDER
export const createOrder = async (req, res) => {
  try {
    const { shippingAddress, paymentMethod } = req.body;

    // Validate payment method
    if (!paymentMethod || !["ONLINE", "COD"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // Get user's cart
    const cart = await Cart.findOne({ user: req.user._id }).populate("items.product");
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate totals
    const subtotal = cart.items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    const tax = subtotal * 0.18; // 18% GST
    const shippingCost = subtotal >= 1000 ? 0 : 50;
    const totalAmount = subtotal + tax + shippingCost;

    // COD validation: not allowed if total > 25,000
    if (paymentMethod === "COD" && totalAmount > 25000) {
      return res.status(400).json({ message: "Cash on Delivery not available for orders above Rs 25,000" });
    }

    // Create order items
    const orderItems = cart.items.map(item => ({
      product_id: item.product._id,
      quantity: item.quantity,
      price: item.product.price
    }));

    // Create order with orderNumber
    const orderNumber = `ORD-${Date.now()}`;
    const order = await Order.create({
      orderNumber,
      user_id: req.user._id,
      items: orderItems,
      shippingAddress: shippingAddress,
      subtotal,
      tax,
      shippingCost,
      totalAmount,
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "Not Paid" : "Not Paid",
      status: "Pending"
    });

    // Clear the cart after order creation
    cart.items = [];
    await cart.save();

    // Populate the order with product details for response
    const populatedOrder = await Order.findById(order._id).populate("items.product_id");

    res.status(201).json(populatedOrder);
  } catch (err) {
    console.error("Create order error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET USER ORDERS
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user_id: req.user._id }).populate("items.product_id");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET ALL ORDERS (Admin)
export const getAllOrders = async (req, res) => {
  try {
    const { paymentMethod, paymentStatus } = req.query;
    let filter = {};

    if (paymentMethod) filter.paymentMethod = paymentMethod;
    if (paymentStatus) filter.paymentStatus = paymentStatus;

    const orders = await Order.find(filter).populate("items.product_id").populate("user_id", "name email");
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// UPDATE ORDER STATUS (Admin)
export const updateOrderStatus = async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ message: "Order not found" });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
