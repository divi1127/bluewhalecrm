const mongoose = require("mongoose");

const billSchema = new mongoose.Schema(
  {
    billNumber: { type: String, required: true, unique: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", required: true },
    package: { type: mongoose.Schema.Types.ObjectId, ref: "Package", required: true },
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 },
    below5: { type: Number, default: 0 },
    baseAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    couponCode: { type: mongoose.Schema.Types.ObjectId, ref: "CouponCode" },
    finalAmount: { type: Number, required: true },
    paymentMode: {
      type: String,
      enum: ["cash", "card", "upi", "wallet"],
      default: "cash",
    },
    notes: { type: String, trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Bill", billSchema);
