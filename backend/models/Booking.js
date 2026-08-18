const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerMobile: { type: String, required: true, trim: true },
    eventType: { type: String, required: true }, // birthday, corporate, family, etc.
    eventDate: { type: Date, required: true },
    eventTime: { type: String, required: true }, // e.g. "4:00 PM - 7:00 PM"
    guestCount: { type: Number, required: true },
    packageDetails: { type: String },
    foodRequirements: { type: String },
    decorationRequirements: { type: String },
    additionalActivities: { type: String },
    totalAmount: { type: Number, required: true },
    advancePaid: { type: Number, default: 0 },
    balanceAmount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["enquiry", "advance_paid", "confirmed", "completed", "cancelled"],
      default: "enquiry",
    },
    source: { type: String, enum: ["online", "staff"], default: "staff" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

bookingSchema.pre("save", function (next) {
  this.balanceAmount = Math.max(this.totalAmount - this.advancePaid, 0);
  next();
});

module.exports = mongoose.model("Booking", bookingSchema);
