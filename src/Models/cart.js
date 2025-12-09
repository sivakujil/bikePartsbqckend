// import mongoose from "mongoose";

// const cartItemSchema = new mongoose.Schema({
//   product_id: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
//   quantity: { type: Number, default: 1 },
// });

// const cartSchema = new mongoose.Schema(
//   {
//     user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     products: [cartItemSchema],
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Cart", cartSchema);


import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, default: 1 },
  price: { type: Number, required: true },
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [cartItemSchema],
}, { timestamps: true });

// FIX: Prevent OverwriteModelError
export default mongoose.models.Cart || mongoose.model("Cart", cartSchema);
