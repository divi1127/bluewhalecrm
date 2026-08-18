const mongoose = require("mongoose");

const staffSchema = new mongoose.Schema(
  {
    staffId: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    phone: { type: String, trim: true },
    designation: { type: String, required: true },
    dob: { type: Date, required: true },
    joiningDate: { type: Date, required: true },
    salaryType: { type: String, enum: ["monthly", "daily"], default: "monthly" },
    salaryAmount: { type: Number, required: true },
    faceDescriptor: { type: [Number], default: undefined },
    faceRegistered: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Staff", staffSchema);
