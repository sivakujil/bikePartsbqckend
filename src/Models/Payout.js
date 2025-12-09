import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', required: true },
  amount: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  payoutMethod: {
    type: String,
    enum: ['bank_transfer', 'cash', 'wallet'],
    default: 'bank_transfer'
  },
  bankDetails: {
    accountNumber: { type: String },
    bankName: { type: String },
    accountHolderName: { type: String }
  },
  processedAt: { type: Date },
  failureReason: { type: String },
  reference: { type: String } // Transaction reference
}, { timestamps: true });

// Indexes
payoutSchema.index({ riderId: 1, status: 1 });
payoutSchema.index({ status: 1 });
payoutSchema.index({ createdAt: -1 });

export default mongoose.model("Payout", payoutSchema);