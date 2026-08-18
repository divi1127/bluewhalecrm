const mongoose = require("mongoose");

const packageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String },
    price: { type: Number, required: true },
    below5Price: { type: Number, default: 0 },
    durationValue: { type: Number, required: true },
    durationUnit: { type: String, enum: ["minutes", "hours"], default: "minutes" },
    durationMinutes: { type: Number, required: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Package", packageSchema);
