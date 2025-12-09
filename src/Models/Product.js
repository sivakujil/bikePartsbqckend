import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    sku: { type: String, unique: true, required: true },
    category: { type: String, required: true },
    brand: { type: String, required: true },
    model: { type: String },
    price: { type: Number, required: true },
    cost: { type: Number, required: true },
    quantity: { type: Number, required: true, default: 0 },
    stock: { type: Number, default: 0 }, // Keep for backward compatibility
    description: { type: String },
    image: { type: String },   // Single image URL for backward compatibility
    images: [{ type: String }], // Array of image URLs
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

// Virtual to ensure stock and quantity stay in sync
productSchema.virtual('stockSync').get(function() {
  return this.stock || this.quantity;
});

productSchema.pre('save', function(next) {
  // Keep stock and quantity synchronized
  if (this.isModified('quantity')) {
    this.stock = this.quantity;
  } else if (this.isModified('stock')) {
    this.quantity = this.stock;
  }
  next();
});

export default mongoose.model("Product", productSchema);
