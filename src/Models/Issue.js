import mongoose from "mongoose";

const issueSchema = new mongoose.Schema({
  orderId: { type: String, required: true },
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', required: true },
  type: {
    type: String,
    enum: ['wrong_address', 'customer_not_available', 'damaged_package', 'wrong_item', 'payment_issue', 'other'],
    required: true
  },
  message: { type: String, required: true },
  images: [{ type: String }], // URLs to uploaded images
  status: {
    type: String,
    enum: ['pending', 'investigating', 'resolved', 'closed'],
    default: 'pending'
  },
  adminResponse: { type: String },
  resolvedAt: { type: Date }
}, { timestamps: true });

// Indexes
issueSchema.index({ riderId: 1, status: 1 });
issueSchema.index({ orderId: 1 });
issueSchema.index({ status: 1 });

export default mongoose.model("Issue", issueSchema);