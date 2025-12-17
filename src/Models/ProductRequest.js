import mongoose from "mongoose";

const productRequestSchema = new mongoose.Schema(
  {
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    replyMessage: {
      type: String,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // Optional for non-logged in users
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    repliedAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// FIX: Prevent OverwriteModelError
export default mongoose.models.ProductRequest || mongoose.model("ProductRequest", productRequestSchema);