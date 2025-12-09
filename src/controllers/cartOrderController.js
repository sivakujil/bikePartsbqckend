import Cart from "../Models/cart.js";
import Order from "../Models/order.js";
import Product from "../Models/Product.js";
import User from "../Models/User.js";

// ============ CART OPERATIONS ============

// Get or create user's cart
export const getCart = async (req, res) => {
  try {
    const userId = req.user.id;
    let cart = await Cart.findOne({ user: userId }).populate("items.product");
    
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }
    
    res.json(cart);
  } catch (err) {
    console.error("Error getting cart:", err);
    res.status(500).json({ message: err.message });
  }
};

// Add item to cart (or increment quantity if exists)
export const addToCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    // Verify product exists and get price
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({ message: `Only ${product.quantity} items available` });
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      cart = await Cart.create({ user: userId, items: [] });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      cart.items.push({
        product: productId,
        quantity: parseInt(quantity),
        price: product.price,
      });
    }

    await cart.save();
    await cart.populate("items.product");

    res.json(cart);
  } catch (err) {
    console.error("Error adding to cart:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update cart item quantity
export const updateCartItem = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity } = req.body;

    if (!productId || quantity === undefined) {
      return res.status(400).json({ message: "Product ID and quantity are required" });
    }

    if (quantity < 0) {
      return res.status(400).json({ message: "Quantity cannot be negative" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );
    if (!item) {
      return res.status(404).json({ message: "Item not in cart" });
    }

    if (quantity === 0) {
      // Remove item if quantity is 0
      cart.items = cart.items.filter(
        (item) => item.product.toString() !== productId
      );
    } else {
      // Check stock
      const product = await Product.findById(productId);
      if (product.quantity < quantity) {
        return res.status(400).json({ message: `Only ${product.quantity} items available` });
      }
      item.quantity = parseInt(quantity);
    }

    await cart.save();
    await cart.populate("items.product");

    res.json(cart);
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ message: err.message });
  }
};

// Remove item from cart
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ message: "Product ID is required" });
    }

    const cart = await Cart.findOne({ user: userId });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();
    await cart.populate("items.product");

    res.json(cart);
  } catch (err) {
    console.error("Error removing from cart:", err);
    res.status(500).json({ message: err.message });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const cart = await Cart.findOne({ user: userId });

    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    cart.items = [];
    await cart.save();

    res.json({ message: "Cart cleared", cart });
  } catch (err) {
    console.error("Error clearing cart:", err);
    res.status(500).json({ message: err.message });
  }
};

// ============ ORDER OPERATIONS ============

// Get user's current pending order (for cart checkout flow)
export const getCurrentOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    let order = await Order.findOne({
      user_id: userId,
      status: "Pending",
    }).populate("items.product_id");

    if (!order) {
      order = null;
    }

    res.json(order);
  } catch (err) {
    console.error("Error getting current order:", err);
    res.status(500).json({ message: err.message });
  }
};

// Create order from cart
export const createOrderFromCart = async (req, res) => {
  try {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod } = req.body;

    console.log("Creating order for user:", userId);
    console.log("Shipping address:", shippingAddress);
    console.log("Payment method:", paymentMethod);

    // Get cart
    const cart = await Cart.findOne({ user: userId }).populate("items.product");
    console.log("Cart found:", cart);
    if (cart) {
      console.log("Cart items:", cart.items);
      // Filter out items where product is null (product deleted)
      cart.items = cart.items.filter(item => item.product !== null);
      await cart.save();
    }
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }

    // Calculate totals
    const subtotal = cart.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippingCost = subtotal > 1000 ? 0 : 50; // Free shipping over ₹1000
    const tax = subtotal * 0.18; // 18% GST
    const totalAmount = subtotal + shippingCost + tax;

    // Validate payment method
    if (!paymentMethod || !["ONLINE", "COD"].includes(paymentMethod)) {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    // COD validation: not allowed if total > 25,000
    if (paymentMethod === "COD" && totalAmount > 25000) {
      return res.status(400).json({ message: "Cash on Delivery not available for orders above Rs 25,000" });
    }

    // Create order items
    const orderItems = cart.items.map((item) => ({
      product_id: item.product._id,
      quantity: item.quantity,
      price: item.price,
    }));

    // Check if pending order exists
    let order = await Order.findOne({
      user_id: userId,
      status: "Pending",
    });

    if (order) {
      // Update existing pending order
      order.items = orderItems;
      order.subtotal = subtotal;
      order.shippingCost = shippingCost;
      order.tax = tax;
      order.totalAmount = totalAmount;
      order.paymentMethod = paymentMethod;
      order.paymentStatus = paymentMethod === "COD" ? "Not Paid" : "Not Paid";
      if (shippingAddress) {
        order.shippingAddress = shippingAddress;
      }
    } else {
      // Create new order
      const orderNumber = `ORD-${Date.now()}`;
      order = new Order({
        orderNumber,
        user_id: userId,
        items: orderItems,
        subtotal,
        shippingCost,
        tax,
        totalAmount,
        shippingAddress: shippingAddress || {},
        paymentMethod,
        paymentStatus: paymentMethod === "COD" ? "Not Paid" : "Not Paid",
        status: "Pending",
      });
    }

    await order.save();
    await order.populate("items.product_id");

    res.status(201).json(order);
  } catch (err) {
    console.error("Error creating order:", err);
    res.status(500).json({ message: err.message });
  }
};

// Update order totals (for manual adjustments)
export const updateOrderTotals = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user_id: userId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Recalculate totals
    const subtotal = order.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    const shippingCost = subtotal > 1000 ? 0 : 50;
    const tax = subtotal * 0.18;
    const totalAmount = subtotal + shippingCost + tax;

    order.subtotal = subtotal;
    order.shippingCost = shippingCost;
    order.tax = tax;
    order.totalAmount = totalAmount;

    await order.save();

    res.json(order);
  } catch (err) {
    console.error("Error updating order totals:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get all user's orders
export const getUserOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const orders = await Order.find({ user_id: userId })
      .populate("items.product_id")
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error("Error getting user orders:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get single order details
export const getOrderById = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user_id: userId,
    }).populate("items.product_id");

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(order);
  } catch (err) {
    console.error("Error getting order:", err);
    res.status(500).json({ message: err.message });
  }
};

// Cancel order (only if Pending)
export const cancelOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { orderId } = req.params;

    const order = await Order.findOne({
      _id: orderId,
      user_id: userId,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.status !== "Pending") {
      return res.status(400).json({ message: "Can only cancel pending orders" });
    }

    order.status = "Cancelled";
    await order.save();

    res.json(order);
  } catch (err) {
    console.error("Error cancelling order:", err);
    res.status(500).json({ message: err.message });
  }
};
