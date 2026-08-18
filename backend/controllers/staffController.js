const asyncHandler = require("../utils/asyncHandler");
const Staff = require("../models/Staff");
const User = require("../models/User");

const nextStaffId = async () => {
  const last = await Staff.findOne({}, { staffId: 1 }).sort({ staffId: -1 });
  const n = last ? parseInt(String(last.staffId).replace(/\D/g, ""), 10) + 1 : 1;
  return `STF${String(n).padStart(4, "0")}`;
};

const dobPassword = (dob) => {
  if (typeof dob === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dob)) {
    const [y, m, d] = dob.split("-");
    return `${d}${m}${y}`;
  }
  const dt = new Date(dob);
  if (Number.isNaN(dt.getTime())) throw new Error("Invalid date of birth");
  const d = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  return `${d}${m}${dt.getFullYear()}`;
};

const getStaff = asyncHandler(async (req, res) => {
  const filter = req.query.active === "true" ? { active: true } : {};
  const staff = await Staff.find(filter).sort({ name: 1 });
  res.json({ success: true, data: staff });
});

const getStaffMember = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }
  res.json({ success: true, data: staff });
});

// Creates a staff member AND an auto-generated login (username = staffId, password = DOB as DDMMYYYY)
const createStaff = asyncHandler(async (req, res) => {
  const { name, phone, designation, dob, joiningDate, salaryType, salaryAmount, role = "billing_staff" } = req.body;
  if (!dob) {
    res.status(400);
    throw new Error("Date of birth is required to create the staff login");
  }

  const staffId = await nextStaffId();
  const staff = await Staff.create({ staffId, name, phone, designation, dob, joiningDate, salaryType, salaryAmount });

  const password = dobPassword(dob);
  const username = staffId.toLowerCase();
  const user = await User.create({
    name,
    username,
    email: `${username}@bluewhale.local`,
    password,
    phone,
    role,
    staff: staff._id,
  });

  res.status(201).json({
    success: true,
    data: { staff, login: { username, email: user.email, password, role: user.role } },
  });
});

const updateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }

  const user = await User.findOne({ staff: staff._id });
  if (user) {
    if (req.body.name !== undefined) user.name = req.body.name;
    if (req.body.phone !== undefined) user.phone = req.body.phone;
    if (req.body.dob !== undefined) user.password = dobPassword(req.body.dob);
    if (req.body.role !== undefined) user.role = req.body.role;
    if (req.body.active !== undefined) user.active = req.body.active;
    await user.save();
  }

  res.json({ success: true, data: staff });
});

const deactivateStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }
  await User.updateOne({ staff: staff._id }, { active: false });
  res.json({ success: true, data: staff });
});

// @desc  Register a face descriptor for face-login at the register
// @route POST /api/staff/:id/face
const registerFace = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }
  const { descriptor } = req.body;
  if (!Array.isArray(descriptor) || descriptor.length < 64) {
    res.status(400);
    throw new Error("A valid face descriptor is required");
  }
  staff.faceDescriptor = descriptor.map(Number);
  staff.faceRegistered = true;
  await staff.save();
  res.json({ success: true, data: { _id: staff._id, name: staff.name, faceRegistered: true } });
});

// @desc  Clear a staff member's registered face
// @route DELETE /api/staff/:id/face
const clearFace = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }
  staff.faceDescriptor = undefined;
  staff.faceRegistered = false;
  await staff.save();
  res.json({ success: true, data: { _id: staff._id, name: staff.name, faceRegistered: false } });
});

module.exports = { getStaff, getStaffMember, createStaff, updateStaff, deactivateStaff, registerFace, clearFace };
