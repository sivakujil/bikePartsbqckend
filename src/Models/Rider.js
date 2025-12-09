import mongoose from "mongoose";

const earningSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  type: { type: String, enum: ['delivery', 'bonus', 'penalty'], default: 'delivery' }
});

const riderSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  riderId: { type: String, required: true, unique: true },
  vehicleType: { type: String, required: true, enum: ['bike', 'scooter', 'car', 'van'] },
  isActive: { type: Boolean, default: true },
  walletBalance: { type: Number, default: 0 },
  earnings: [earningSchema],
  fcmToken: { type: String }, // For push notifications
  currentLocation: {
    lat: { type: Number },
    lng: { type: Number },
    lastUpdated: { type: Date }
  },
  otp: {
    code: { type: String },
    expiresAt: { type: Date }
  },
  rating: { type: Number, default: 5.0, min: 0, max: 5 },
  totalDeliveries: { type: Number, default: 0 },
  currentOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'RiderOrder' }
}, { timestamps: true });

// Index for efficient queries
riderSchema.index({ isActive: 1 });

export default mongoose.model("Rider", riderSchema);
