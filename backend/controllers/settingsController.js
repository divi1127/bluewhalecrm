const asyncHandler = require("../utils/asyncHandler");
const AttendanceSetting = require("../models/AttendanceSetting");

// @desc  Get the current attendance enforcement settings
// @route GET /api/settings/attendance
const getAttendanceSettings = asyncHandler(async (req, res) => {
  const settings = await AttendanceSetting.getSingleton();
  res.json({ success: true, data: settings });
});

// @desc  Update attendance enforcement settings
// @route PUT /api/settings/attendance
const updateAttendanceSettings = asyncHandler(async (req, res) => {
  const { faceVerification, gps, salary } = req.body;

  const settings = await AttendanceSetting.getSingleton();

  if (faceVerification) {
    if (faceVerification.method) settings.faceVerification.method = faceVerification.method;
    if (Array.isArray(faceVerification.enforcedOn)) {
      const allowed = ["login", "checkin", "checkout"];
      settings.faceVerification.enforcedOn = faceVerification.enforcedOn.filter((v) => allowed.includes(v));
    }
  }

  if (gps && gps.enforcement) settings.gps.enforcement = gps.enforcement;

  if (salary) {
    if (salary.allowedLeavesPerMonth !== undefined) {
      settings.salary.allowedLeavesPerMonth = Math.max(0, Math.floor(Number(salary.allowedLeavesPerMonth) || 0));
    }
    if (salary.shiftStart !== undefined && /^\d{1,2}:\d{2}$/.test(String(salary.shiftStart))) {
      settings.salary.shiftStart = salary.shiftStart;
    }
    if (salary.graceMinutes !== undefined) {
      settings.salary.graceMinutes = Math.max(0, Math.floor(Number(salary.graceMinutes) || 0));
    }
    if (salary.latesPerDeduction !== undefined) {
      settings.salary.latesPerDeduction = Math.max(0, Math.floor(Number(salary.latesPerDeduction) || 0));
    }
  }

  await settings.save();
  res.json({ success: true, data: settings });
});

module.exports = { getAttendanceSettings, updateAttendanceSettings };