const mongoose = require("mongoose");

// An individual scannable/redeemable code generated under a Coupon campaign
const couponCodeSchema = new mongoose.Schema(
  {
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", required: true },
    code: { type: String, required: true, unique: true },
    used: { type: Boolean, default: false },
    usedBill: { type: mongoose.Schema.Types.ObjectId, ref: "Bill" },
    usedAt: { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CouponCode", couponCodeSchema);
