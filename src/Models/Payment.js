import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    order_id: { type: mongoose.Schema.Types.ObjectId, ref: "Order" },
    amount: Number,
    currency: { type: String, default: "USD" },
    payment_type: { type: String, enum: ["Card", "Wallet", "Cash_on_delivery"] },
    payment_provider_id: String,
    status: { type: String, enum: ["Pending","Succeeded","Failed","Refunded"], default: "Pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);
