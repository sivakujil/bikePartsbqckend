import mongoose from "mongoose";

const productRequestSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for non-logged in users
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "fulfilled"],
      default: "pending",
    },
  },
  { timestamps: true }
);

// FIX: Prevent OverwriteModelError
export default mongoose.models.ProductRequest || mongoose.model("ProductRequest", productRequestSchema);