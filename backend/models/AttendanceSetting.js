const mongoose = require("mongoose");

// Singleton config document (only one row exists) controlling how staff
// attendance is enforced: face-verification (photo capture + store) and GPS.
const attendanceSettingSchema = new mongoose.Schema(
  {
    faceVerification: {
      method: {
        type: String,
        enum: ["photo_capture_store", "none"],
        default: "photo_capture_store",
      },
      // Where the photo is required: "login", "checkin", "checkout"
      enforcedOn: {
        type: [String],
        default: ["login", "checkin", "checkout"],
      },
    },
    gps: {
      // recorded = always capture; warn = capture but only warn if off; required = block if off
      enforcement: {
        type: String,
        enum: ["recorded", "warn", "required", "off"],
        default: "warn",
      },
    },
    salary: {
      // Paid leaves allowed per month; any leave beyond this deducts one day's salary each.
      allowedLeavesPerMonth: { type: Number, default: 2, min: 0 },
    },
  },
  { timestamps: true }
);

attendanceSettingSchema.statics.getSingleton = async function () {
  let doc = await this.findOne().sort({ _id: 1 });
  if (!doc) {
    doc = await this.create({});
  }
  return doc;
};

module.exports = mongoose.model("AttendanceSetting", attendanceSettingSchema);
