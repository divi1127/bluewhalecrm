const asyncHandler = require("../utils/asyncHandler");
const Attendance = require("../models/Attendance");
const AttendanceSetting = require("../models/AttendanceSetting");
const Staff = require("../models/Staff");
const User = require("../models/User");
const { computeSalaryBreakdown } = require("../utils/salary");

const todayStr = () => new Date().toISOString().slice(0, 10);

// Minutes between a check-in time and the configured shift start (beyond grace).
// Returns 0 when the staff member is on time or no shift is configured.
const computeLateMinutes = async (now) => {
  const settings = await AttendanceSetting.getSingleton();
  const shiftStart = settings.salary?.shiftStart;
  if (!shiftStart || !/^\d{1,2}:\d{2}$/.test(shiftStart)) return 0;
  const [h, m] = shiftStart.split(":").map(Number);
  const shift = new Date(now);
  shift.setHours(h, m, 0, 0);
  const grace = (settings.salary?.graceMinutes ?? 0) * 60 * 1000;
  const lateMs = now.getTime() - shift.getTime() - grace;
  return lateMs > 0 ? Math.floor(lateMs / 60000) : 0;
};

// Validates a check-in/out payload against the enforcement settings.
// Returns the sanitized { facePhoto, gps } to store, or throws 400.
const enforceSettings = async (req, res, scope, body) => {
  const settings = await AttendanceSetting.getSingleton();

  const enforceFace = settings.faceVerification.method === "photo_capture_store";
  const faceNeeded = enforceFace && (settings.faceVerification.enforcedOn || []).includes(scope);

  if (faceNeeded && !body.facePhoto) {
    res.status(400);
    throw new Error(`Face verification (photo) is required for ${scope}`);
  }

  const gpsMode = settings.gps.enforcement; // recorded | warn | required | off
  if (gpsMode !== "off" && (!body.gps || typeof body.gps.lat !== "number" || typeof body.gps.lng !== "number")) {
    if (gpsMode === "required") {
      res.status(400);
      throw new Error(`GPS location is required for ${scope} — enable location and try again`);
    }
    // recorded / warn: soft-fail, capture what we have (null is fine)
  }

  return {
    facePhoto: faceNeeded ? body.facePhoto : undefined,
    gps:
      gpsMode !== "off" && body.gps
        ? {
            lat: body.gps.lat,
            lng: body.gps.lng,
            accuracy: body.gps.accuracy,
            capturedAt: new Date(),
          }
        : undefined,
  };
};

const ownStaffId = async (req, res) => {
  const user = await User.findById(req.user._id).select("staff active");
  if (!user || !user.active) {
    res.status(403);
    throw new Error("No active staff profile linked to this login");
  }
  if (!user.staff) {
    res.status(403);
    throw new Error("No staff profile linked to this login");
  }
  return user.staff;
};

// @desc  Check in a staff member for today (creates or updates today's record)
// @route POST /api/attendance/checkin
const checkIn = asyncHandler(async (req, res) => {
  const { staffId, date = todayStr() } = req.body;
  const enforced = await enforceSettings(req, res, "checkin", req.body);
  const lateMinutes = date === todayStr() ? await computeLateMinutes(new Date()) : 0;
  let record = await Attendance.findOne({ staff: staffId, date });
  if (record && record.checkIn) {
    res.status(400);
    throw new Error("Staff member has already checked in today");
  }
  if (!record) {
    record = await Attendance.create({
      staff: staffId,
      date,
      checkIn: new Date(),
      status: "present",
      lateMinutes,
      facePhoto: enforced.facePhoto,
      gps: enforced.gps,
    });
  } else {
    record.checkIn = new Date();
    record.status = "present";
    record.lateMinutes = lateMinutes;
    record.facePhoto = enforced.facePhoto || record.facePhoto;
    record.gps = enforced.gps || record.gps;
    await record.save();
  }
  res.json({ success: true, data: record });
});

// @desc  Check out a staff member, optionally computing overtime
// @route POST /api/attendance/checkout
const checkOut = asyncHandler(async (req, res) => {
  const { staffId, date = todayStr(), overtimeHours = 0 } = req.body;
  const enforced = await enforceSettings(req, res, "checkout", req.body);
  const record = await Attendance.findOne({ staff: staffId, date });
  if (!record || !record.checkIn) {
    res.status(400);
    throw new Error("Staff member has not checked in today");
  }
  record.checkOut = new Date();
  record.overtimeHours = overtimeHours;
  record.facePhoto = enforced.facePhoto || record.facePhoto;
  record.gps = enforced.gps || record.gps;
  await record.save();
  res.json({ success: true, data: record });
});

// @desc  Self check-in for the logged-in staff member
// @route POST /api/attendance/me/checkin
const selfCheckIn = asyncHandler(async (req, res) => {
  const staffId = await ownStaffId(req, res);
  const date = todayStr();
  const enforced = await enforceSettings(req, res, "checkin", req.body);
  const lateMinutes = await computeLateMinutes(new Date());
  let record = await Attendance.findOne({ staff: staffId, date });
  if (record && record.checkIn) {
    res.status(400);
    throw new Error("You have already checked in today");
  }
  if (!record) {
    record = await Attendance.create({
      staff: staffId,
      date,
      checkIn: new Date(),
      status: "present",
      lateMinutes,
      facePhoto: enforced.facePhoto,
      gps: enforced.gps,
    });
  } else {
    record.checkIn = new Date();
    record.status = "present";
    record.lateMinutes = lateMinutes;
    record.facePhoto = enforced.facePhoto || record.facePhoto;
    record.gps = enforced.gps || record.gps;
    await record.save();
  }
  res.json({ success: true, data: record });
});

// @desc  Self check-out for the logged-in staff member
// @route POST /api/attendance/me/checkout
const selfCheckOut = asyncHandler(async (req, res) => {
  const staffId = await ownStaffId(req, res);
  const date = todayStr();
  const enforced = await enforceSettings(req, res, "checkout", req.body);
  const record = await Attendance.findOne({ staff: staffId, date });
  if (!record || !record.checkIn) {
    res.status(400);
    throw new Error("You have not checked in today");
  }
  record.checkOut = new Date();
  record.overtimeHours = Number(req.body.overtimeHours) || 0;
  record.facePhoto = enforced.facePhoto || record.facePhoto;
  record.gps = enforced.gps || record.gps;
  await record.save();
  res.json({ success: true, data: record });
});

// @desc  Today's record + recent history for the logged-in staff member
// @route GET /api/attendance/me
const selfStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select("staff active");
  if (!user || !user.active || !user.staff) {
    // No staff profile linked (e.g. admin/standalone logins) — graceful empty state,
    // the UI shows a notice instead of a hard 403.
    return res.json({ success: true, data: { staff: null, today: null, recent: [] } });
  }
  const staff = await Staff.findById(user.staff);
  const today = await Attendance.findOne({ staff: user.staff, date: todayStr() });
  const recent = await Attendance.find({ staff: user.staff }).sort({ date: -1 }).limit(30);
  res.json({
    success: true,
    data: {
      staff: staff ? { _id: staff._id, staffId: staff.staffId, name: staff.name, designation: staff.designation } : null,
      today,
      recent,
    },
  });
});

// @desc  Manually mark leave / half-day / absent for a staff member on a date
// @route POST /api/attendance/mark
const markStatus = asyncHandler(async (req, res) => {
  const { staffId, date = todayStr(), status, notes } = req.body;
  const record = await Attendance.findOneAndUpdate(
    { staff: staffId, date },
    { status, notes },
    { new: true, upsert: true, runValidators: true }
  );
  res.json({ success: true, data: record });
});

// @desc  Attendance records for a date range, optionally filtered by staff
// @route GET /api/attendance?from=&to=&staffId=
const getAttendance = asyncHandler(async (req, res) => {
  const { from, to, staffId } = req.query;
  const query = {};
  if (staffId) query.staff = staffId;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }
  const records = await Attendance.find(query).populate("staff", "name designation").sort({ date: -1 });
  res.json({ success: true, data: records });
});

// @desc  Per-person attendance totals for a date range (daily/weekly/monthly/yearly/custom)
// @route GET /api/attendance/summary?from=&to=&staffId=
const getAttendanceSummary = asyncHandler(async (req, res) => {
  const { from, to, staffId } = req.query;
  const query = {};
  if (staffId) query.staff = staffId;
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }
  const records = await Attendance.find(query).populate("staff", "name designation staffId");

  const byStaff = new Map();
  for (const r of records) {
    const key = String(r.staff?._id || r.staff);
    if (!byStaff.has(key)) {
      byStaff.set(key, {
        staff: r.staff
          ? { _id: r.staff._id, staffId: r.staff.staffId, name: r.staff.name, designation: r.staff.designation }
          : null,
        totalRecords: 0,
        presentDays: 0,
        absentDays: 0,
        halfDays: 0,
        leaveDays: 0,
        lateDays: 0,
        totalOvertimeHours: 0,
      });
    }
    const s = byStaff.get(key);
    s.totalRecords += 1;
    if (r.status === "present") s.presentDays += 1;
    else if (r.status === "absent") s.absentDays += 1;
    else if (r.status === "half-day") s.halfDays += 1;
    else if (r.status === "leave") s.leaveDays += 1;
    if ((r.lateMinutes || 0) > 0) s.lateDays += 1;
    s.totalOvertimeHours += r.overtimeHours || 0;
  }

  res.json({ success: true, data: [...byStaff.values()] });
});

// @desc  Compute monthly salary for a staff member based on attendance.
//        Leave policy: the first `allowedLeavesPerMonth` (default 2) leaves are paid;
//        any leave beyond that deducts one day's salary for each extra day.
// @route GET /api/attendance/salary/:staffId?month=YYYY-MM
const computeMonthlySalary = asyncHandler(async (req, res) => {
  const { staffId } = req.params;
  const { month } = req.query; // "YYYY-MM"
  if (!month) {
    res.status(400);
    throw new Error("month query param (YYYY-MM) is required");
  }

  const staff = await Staff.findById(staffId);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  const records = await Attendance.find({ staff: staffId, date: { $regex: `^${month}` } });
  const settings = await AttendanceSetting.getSingleton();
  const breakdown = computeSalaryBreakdown(staff, records, settings, month);
  res.json({ success: true, data: breakdown });
});

// @desc  Super admin grants permission for a staff member to face-login again after checkout
// @route PATCH /api/attendance/grant-relogin
const grantReLogin = asyncHandler(async (req, res) => {
  const { staffId, date } = req.body;
  const targetDate = date || todayStr();
  const record = await Attendance.findOneAndUpdate(
    { staff: staffId, date: targetDate },
    { allowReLogin: true },
    { new: true, upsert: false }
  );
  if (!record) {
    res.status(404);
    throw new Error("No attendance record found for this staff on the given date");
  }
  res.json({ success: true, message: "Re-login permission granted", data: record });
});

module.exports = { checkIn, checkOut, markStatus, getAttendance, getAttendanceSummary, computeMonthlySalary, selfCheckIn, selfCheckOut, selfStatus, grantReLogin, computeLateMinutes };
