import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  price: { type: Number, required: true }
});

const locationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  address: { type: String, required: true },
  phone: { type: String }
});

const riderOrderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  items: [itemSchema],
  pickup: locationSchema,
  delivery: locationSchema,
  codAmount: { type: Number, default: 0 },
  status: {
    type: String,
    enum: ['assigned', 'picked_up', 'out_for_delivery', 'delivered', 'cancelled'],
    default: 'assigned'
  },
  assignedRider: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', required: true },
  otpPickup: { type: String },
  otpDelivery: { type: String },
  photos: [{ type: String }], // URLs to proof images
  pickupTime: { type: Date },
  deliveredAt: { type: Date },
  cancelledAt: { type: Date },
  cancelReason: { type: String },
  cashCollected: { type: Number, default: 0 },
  cashSettlementStatus: { type: String, enum: ['pending', 'settled'], default: 'pending' },
  notes: { type: String }
}, { timestamps: true });

// Indexes
riderOrderSchema.index({ assignedRider: 1, status: 1 });
riderOrderSchema.index({ status: 1 });

export default mongoose.model("RiderOrder", riderOrderSchema);