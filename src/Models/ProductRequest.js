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
    userMessage: {
      type: String,
      trim: true,
    },
    adminReply: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["Pending", "Replied"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

// FIX: Prevent OverwriteModelError
export default mongoose.models.ProductRequest || mongoose.model("ProductRequest", productRequestSchema);