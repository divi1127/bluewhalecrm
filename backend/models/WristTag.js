const mongoose = require("mongoose");

const wristTagSchema = new mongoose.Schema(
  {
    tagId: { type: String, required: true, unique: true },
    qrCodeDataUrl: { type: String, required: true },
    indoorQrCodeDataUrl: { type: String },
    outdoorQrCodeDataUrl: { type: String },
    bill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill", required: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    below5: { type: Number, default: 0 },
    personType: {
      type: String,
      enum: ["adult", "child", "below5"],
      default: "adult",
    },
    status: {
      type: String,
      enum: ["unused", "active", "expired", "exited"],
      default: "unused",
    },
    indoorStatus: {
      type: String,
      enum: ["unused", "active", "expired", "exited"],
      default: "unused",
    },
    outdoorStatus: {
      type: String,
      enum: ["unused", "active", "expired", "exited"],
      default: "unused",
    },
    entryTime: { type: Date },
    expiryTime: { type: Date },
    exitTime: { type: Date },
    indoorEntryTime: { type: Date },
    indoorExitTime: { type: Date },
    outdoorEntryTime: { type: Date },
    outdoorExitTime: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("WristTag", wristTagSchema);
