const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const Staff = require("../models/Staff");

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

// Euclidean distance between two face descriptors (128-dim)
const distance = (a, b) => {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i] - b[i];
    sum += d * d;
  }
  return Math.sqrt(sum);
};

// @desc  Register a new user (Super Admin only, via authorize middleware on route)
// @route POST /api/auth/register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, phone, role, dob } = req.body;

  const exists = await User.findOne({ email });
  if (exists) {
    res.status(400);
    throw new Error("A user with this email already exists");
  }

  let pwd = password;
  if (!pwd) {
    pwd = User.dobPassword(dob);
    if (!pwd) {
      res.status(400);
      throw new Error("Set a password, or provide the user's DOB to use as their password");
    }
  }

  const user = await User.create({ name, email, password: pwd, phone, role, dob });

  res.status(201).json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: signToken(user._id),
    },
  });
});

// @desc  Login with a staff login ID (username), or email, and receive a JWT
// @route POST /api/auth/login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const identifier = String(email || "").trim();

  const user = await User.findOne({
    $or: [{ email: identifier.toLowerCase() }, { username: identifier.toLowerCase() }],
  }).select("+password");

  if (!user || !(await user.matchPassword(password))) {
    res.status(401);
    throw new Error("Invalid login ID or password");
  }
  if (!user.active) {
    res.status(403);
    throw new Error("This account has been deactivated");
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions: user.permissions || [],
      staff: user.staff,
      token: signToken(user._id),
    },
  });
});

// @desc  Get current logged-in user
// @route GET /api/auth/me
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("staff", "name staffId designation");
  res.json({ success: true, data: user });
});

// Haversine formula — returns distance in meters between two GPS coordinates
const haversineMeters = (lat1, lng1, lat2, lng2) => {
  const R = 6371000; // Earth radius in meters
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

// @desc  Face login at the register: match a captured descriptor against registered staff faces
// @route POST /api/auth/face-login
const faceLogin = asyncHandler(async (req, res) => {
  const { descriptor, gps } = req.body;
  if (!Array.isArray(descriptor) || descriptor.length < 64) {
    res.status(400);
    throw new Error("No valid face data captured");
  }

  // --- GPS Geofence check (10 metre radius) ---
  const parkLat = parseFloat(process.env.PARK_LAT);
  const parkLng = parseFloat(process.env.PARK_LNG);
  if (parkLat && parkLng) {
    if (!gps || typeof gps.lat !== "number" || typeof gps.lng !== "number") {
      res.status(400);
      throw new Error("GPS location is required for face login. Please enable location access and try again.");
    }
    const distMeters = haversineMeters(parkLat, parkLng, gps.lat, gps.lng);
    if (distMeters > 10) {
      res.status(403);
      throw new Error(`You are ${Math.round(distMeters)}m away from the park. Face login is only allowed within 10 metres of the park.`);
    }
  }

  const candidates = await Staff.find({ faceRegistered: true, active: true })
    .select("faceDescriptor staffId name designation")
    .lean();

  let best = null;
  let bestDist = Infinity;
  for (const staff of candidates) {
    const d = distance(descriptor, staff.faceDescriptor);
    if (d < bestDist) {
      bestDist = d;
      best = staff;
    }
  }

  if (!best || bestDist > 0.55) {
    res.status(401);
    throw new Error("Face not recognized. Please try again or log in with password.");
  }

  const user = await User.findOne({ staff: best._id, active: true }).select("+password");
  if (!user) {
    res.status(401);
    throw new Error("No active login is linked to this face");
  }

  // Auto check-in attendance + re-login block
  const Attendance = require("../models/Attendance");
  const { computeLateMinutes } = require("./attendanceController");
  const date = new Date().toISOString().slice(0, 10);
  let record = await Attendance.findOne({ staff: best._id, date });

  // Block re-login if staff already checked out, unless super admin granted permission
  if (record && record.checkOut && !record.allowReLogin) {
    res.status(403);
    throw new Error(
      "You have already logged out for today. Please ask the Super Admin to grant re-login permission."
    );
  }

  if (!record) {
    record = await Attendance.create({
      staff: best._id,
      date,
      checkIn: new Date(),
      status: "present",
      lateMinutes: await computeLateMinutes(new Date()),
      gps: gps
        ? { lat: gps.lat, lng: gps.lng, accuracy: gps.accuracy, capturedAt: new Date() }
        : undefined,
    });
  } else if (!record.checkIn) {
    record.checkIn = new Date();
    record.status = "present";
    record.lateMinutes = await computeLateMinutes(new Date());
    if (gps) record.gps = { lat: gps.lat, lng: gps.lng, accuracy: gps.accuracy, capturedAt: new Date() };
    await record.save();
  } else if (record.checkOut && record.allowReLogin) {
    // Reset checkout so they can log in again
    record.checkOut = undefined;
    record.allowReLogin = false; // consume the permission
    await record.save();
  }

  res.json({
    success: true,
    data: {
      _id: user._id,
      name: user.name,
      email: user.email,
      username: user.username,
      role: user.role,
      permissions: user.permissions || [],
      staff: { _id: best._id, name: best.name, staffId: best.staffId, designation: best.designation },
      token: signToken(user._id),
      faceDistance: Math.round(bestDist * 1000) / 1000,
    },
  });
});

module.exports = { registerUser, loginUser, getMe, faceLogin };
