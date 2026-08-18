const mongoose = require("mongoose");

// A partner campaign, e.g. "Kumaran Textiles - Diwali Offer"
const couponSchema = new mongoose.Schema(
  {
    partnerName: { type: String, required: true, trim: true },
    campaignName: { type: String, required: true, trim: true },
    discountType: { type: String, enum: ["flat", "percent"], required: true },
    discountValue: { type: Number, required: true },
    minBillAmount: { type: Number, default: 0 },
    validFrom: { type: Date, required: true },
    validTo: { type: Date, required: true },
    totalCodesIssued: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Coupon", couponSchema);
