
import dotenv from "dotenv";
dotenv.config();

import Stripe from "stripe";
import Payment from "../Models/Payment.js";
import Order from "../Models/order.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createPayment = async (req, res) => {
  try {
    const { items, orderId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    // Validate order exists if orderId is provided
    if (orderId) {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
    }

    const lineItems = items.map((item) => ({
      price_data: {
        currency: "lkr",
        product_data: {
          name: item.name,
          description: item.description || `Bike part: ${item.name}`
        },
        unit_amount: Math.round(item.price * 100),
      },
      quantity: item.quantity,
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      line_items: lineItems,
      success_url: (process.env.STRIPE_SUCCESS_URL || "http://localhost:5173/checkout-success") + "/{CHECKOUT_SESSION_ID}",
      cancel_url: process.env.STRIPE_CANCEL_URL || "http://localhost:5173/checkout-cancel",
      metadata: {
        orderId: orderId || '',
        userId: req.user._id.toString()
      }
    });

    // compute amount from items (don't rely on session.amount_total)
    const amount = items.reduce((t, i) => t + i.price * i.quantity, 0);

    const payment = await Payment.create({
      user_id: req.user._id,
      order_id: orderId || null,
      amount,
      currency: "LKR",
      payment_type: "Card",
      payment_provider_id: session.id,
      status: "Pending",
    });

    // If order exists, update it with payment reference
    if (orderId) {
      await Order.findByIdAndUpdate(orderId, { 
        payment_id: payment._id,
        status: "Paid"
      });
    }

    res.json({
      status: "success",
      checkout_url: session.url,
      session_id: session.id,
      payment_id: payment._id
    });
  } catch (err) {
    console.log("Payment Create Error:", err);
    res.status(500).json({ message: "Payment creation failed", error: err.message });
  }
};

export const getPayments = async (req, res) => {
  try {
    const payments = await Payment.find();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payments" });
  }
};

export const stripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;
  
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        
        // Update payment status
        const payment = await Payment.findOneAndUpdate(
          { payment_provider_id: session.id }, 
          { status: "Succeeded" },
          { new: true }
        );

        // If payment has an order, update order status and create shipment
        if (payment && payment.order_id) {
          await Order.findByIdAndUpdate(
            payment.order_id, 
            { status: "Processing" }
          );

          // Create shipment for the order
          const Shipment = (await import("../Models/shipment.js")).default;
          await Shipment.create({
            order_id: payment.order_id,
            courier: "Standard Delivery",
            tracking_number: `TRK${Date.now()}`,
            status: "Pending"
          });
        }
        
        console.log(`Payment ${session.id} completed successfully`);
        break;

      case 'checkout.session.expired':
        const expiredSession = event.data.object;
        await Payment.findOneAndUpdate(
          { payment_provider_id: expiredSession.id }, 
          { status: "Failed" }
        );
        console.log(`Payment ${expiredSession.id} expired`);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
  } catch (err) {
    console.error("Webhook processing error:", err);
    return res.status(500).json({ error: "Webhook processing failed" });
  }

  res.json({ received: true });
};

export const getPaymentByOrderId = async (req, res) => {
  try {
    const { orderId } = req.params;
    const payment = await Payment.findOne({ order_id: orderId }).populate('order_id');

    if (!payment) {
      return res.status(404).json({ message: "Payment not found for this order" });
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payment", error: err.message });
  }
};

export const getPaymentBySessionId = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const payment = await Payment.findOne({ payment_provider_id: sessionId }).populate({
      path: 'order_id',
      populate: {
        path: 'items.product_id',
        model: 'Product'
      }
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    res.json(payment);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch payment", error: err.message });
  }
};
