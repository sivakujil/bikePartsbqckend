import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      required: true,
    },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [orderItemSchema],
    subtotal: Number,
    shippingCost: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    totalAmount: Number,
    status: { 
      type: String, 
      enum: ["Pending","Paid","Processing","In Transit","Out for Delivery","Shipped","Completed","Cancelled"], 
      default: "Pending" 
    },
    paymentMethod: {
      type: String,
      enum: ["ONLINE", "COD"],
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["Paid", "Not Paid"],
      default: "Not Paid"
    },
    payment_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Payment" 
    },
    shipment_id: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Shipment" 
    },
    shippingAddress: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    // Delivery related fields
    assignedRider: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    },
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    deliveryNotes: String,
    // Tracking
    trackingHistory: [{
      status: String,
      timestamp: { type: Date, default: Date.now },
      note: String,
      updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    }],
    // Priority
    priority: {
      type: String,
      enum: ["low", "normal", "high", "urgent"],
      default: "normal"
    },
    // Refund
    refundAmount: Number,
    refundReason: String,
    refundDate: Date,
  },
  { timestamps: true }
);

// Generate order number before saving
orderSchema.pre('save', async function(next) {
  if (!this.orderNumber) {
    const count = await this.constructor.countDocuments();
    this.orderNumber = `ORD${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

export default mongoose.model("Order", orderSchema);
