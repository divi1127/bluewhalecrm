const mongoose = require("mongoose");

const enquirySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    message: { type: String, trim: true, default: "" },
    source: { type: String, enum: ["landing", "walk_in", "phone"], default: "landing" },
    status: { type: String, enum: ["new", "contacted", "closed"], default: "new" },
    notes: { type: String, trim: true, default: "" },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Enquiry", enquirySchema);