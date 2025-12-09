import mongoose from "mongoose";

const adSchema = new mongoose.Schema(
  {
    title: String,
    image: String,
    link: String,
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("Ad", adSchema);
