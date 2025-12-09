import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    phone: {
      type: String,
    },
    role: {
      type: String,
      enum: ["user", "admin", "rider"],
      default: "user",
    },
    // Rider specific fields
    riderId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values but ensure uniqueness when present
    },
    vehicleType: {
      type: String,
      enum: ["motorcycle", "scooter", "bicycle", "car"],
    },
    vehicleNumber: String,
    licenseNumber: String,
    isOnline: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      default: 5.0,
      min: 0,
      max: 5,
    },
    assignedOrders: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order"
    }],
    // Admin specific fields
    permissions: [{
      type: String,
      enum: ["products", "orders", "customers", "riders", "reports", "settings"]
    }],
    lastLogin: Date,
  },
  { timestamps: true }
);

// FIX: Prevent OverwriteModelError
export default mongoose.models.User || mongoose.model("User", userSchema);
