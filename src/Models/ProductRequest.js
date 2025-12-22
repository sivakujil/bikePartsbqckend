import mongoose from "mongoose";

const productRequestSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["pending", "seen", "replied"],
      default: "pending",
    },
    adminReply: {
      type: String,
      trim: true,
    },
    estimatedDate: {
      type: Date,
    },
  },
  { timestamps: true }
);

// FIX: Prevent OverwriteModelError
export default mongoose.models.ProductRequest || mongoose.model("ProductRequest", productRequestSchema);