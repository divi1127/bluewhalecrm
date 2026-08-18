const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff", required: true },
    date: { type: String, required: true }, // stored as YYYY-MM-DD for easy day-level uniqueness
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: {
      type: String,
      enum: ["present", "absent", "half-day", "leave"],
      default: "present",
    },
    overtimeHours: { type: Number, default: 0 },
    notes: { type: String },
    facePhoto: { type: String }, // base64 data-URL captured at check-in/out
    gps: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number },
      capturedAt: { type: Date },
    },
    allowReLogin: { type: Boolean, default: false }, // Super admin can grant re-login after checkout
  },
  { timestamps: true }
);

attendanceSchema.index({ staff: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
