const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true, index: true },
    whatsapp: { type: String, trim: true },
    address: { type: String, trim: true },
    totalVisits: { type: Number, default: 0 },
    totalSpending: { type: Number, default: 0 },
    lastVisitDate: { type: Date },
    customerType: {
      type: String,
      enum: ["new", "regular", "vip", "inactive"],
      default: "new",
    },
    notes: { type: String },
    // Follow-up tracking (CRM)
    followUpDate: { type: Date },
    followUpNote: { type: String },
    nextFollowUpDate: { type: Date },
    followUpStatus: {
      type: String,
      enum: ["none", "pending", "contacted", "won", "lost"],
      default: "none",
    },
  },
  { timestamps: true }
);

customerSchema.index({ mobile: 1 });

module.exports = mongoose.model("Customer", customerSchema);
