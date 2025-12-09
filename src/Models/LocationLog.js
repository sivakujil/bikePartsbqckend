import mongoose from "mongoose";

const locationLogSchema = new mongoose.Schema({
  riderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rider', required: true },
  lat: { type: Number, required: true },
  lng: { type: Number, required: true },
  speed: { type: Number, default: 0 }, // km/h
  heading: { type: Number }, // degrees
  accuracy: { type: Number }, // meters
  ts: { type: Date, default: Date.now }
}, { timestamps: true });

// Indexes for efficient queries
locationLogSchema.index({ riderId: 1, ts: -1 });
locationLogSchema.index({ ts: -1 });

export default mongoose.model("LocationLog", locationLogSchema);