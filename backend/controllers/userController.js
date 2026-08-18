const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");
const Staff = require("../models/Staff");

const USER_FIELDS = "-password";

// @desc  List all users with their staff link and module access
// @route GET /api/users
const getUsers = asyncHandler(async (req, res) => {
  const users = await User.find()
    .select(USER_FIELDS)
    .populate("staff", "staffId name designation")
    .sort({ createdAt: 1 });
  res.json({ success: true, data: users });
});

// @desc  Get a single user
// @route GET /api/users/:id
const getUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(USER_FIELDS).populate("staff", "staffId name designation");
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  res.json({ success: true, data: user });
});

// @desc  Create a standalone user (super admin only)
// @route POST /api/users
const createUser = asyncHandler(async (req, res) => {
  const { name, email, username, password, phone, role, permissions, dob } = req.body;
  let pwd = password;
  if (!pwd) {
    pwd = User.dobPassword(dob);
    if (!pwd) {
      res.status(400);
      throw new Error("Set a password, or provide the user's DOB to use as their password");
    }
  }
  if (pwd.length < 6) {
    res.status(400);
    throw new Error("Password must be at least 6 characters");
  }

  const exists = await User.findOne({
    $or: [
      { email: (email || "").toLowerCase() },
      { username: (username || "").toLowerCase() },
    ],
  });
  if (exists) {
    res.status(400);
    throw new Error("A user with this email or login ID already exists");
  }

  const user = await User.create({
    name,
    email: (email || "").toLowerCase(),
    username: (username || "").toLowerCase(),
    password: pwd,
    phone,
    dob,
    role: role || "billing_staff",
    permissions: permissions || [],
  });

  res.status(201).json({ success: true, data: user.toJSON({ transform: (_, u) => { delete u.password; return u; } }) });
});

// @desc  Update a user's details, role, active flag or module permissions
// @route PUT /api/users/:id
const updateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }

  const { name, email, username, phone, role, active, permissions, password, dob } = req.body;

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = (email || "").toLowerCase();
  if (username !== undefined) user.username = (username || "").toLowerCase();
  if (phone !== undefined) user.phone = phone;
  if (dob !== undefined) user.dob = dob;
  if (role !== undefined) user.role = role;
  if (active !== undefined) user.active = active;
  if (permissions !== undefined) user.permissions = permissions;
  if (password) {
    if (password.length < 6) {
      res.status(400);
      throw new Error("Password must be at least 6 characters");
    }
    user.password = password;
  }

  await user.save();

  const updated = await User.findById(user._id).select(USER_FIELDS).populate("staff", "staffId name designation");
  res.json({ success: true, data: updated });
});

// @desc  Deactivate a user (revokes login access). Super admin cannot deactivate themselves.
// @route DELETE /api/users/:id
const deactivateUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  if (user._id.toString() === req.user._id.toString()) {
    res.status(400);
    throw new Error("You cannot deactivate your own account");
  }
  user.active = false;
  await user.save();
  res.json({ success: true, data: { _id: user._id, active: false } });
});

// @desc  Reset a user's password (super admin types and sets the new password)
// @route POST /api/users/:id/reset-password
const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const newPassword = req.body.password;
  if (!newPassword || newPassword.length < 6) {
    res.status(400);
    throw new Error("Please type a new password (at least 6 characters) to set");
  }
  user.password = newPassword;
  await user.save();
  res.json({ success: true, data: { username: user.username, email: user.email, password: newPassword } });
});

// @desc  Link a user to an existing staff member
// @route POST /api/users/:id/link-staff
const linkStaff = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error("User not found");
  }
  const { staffId } = req.body;
  const staff = await Staff.findById(staffId);
  if (!staff) {
    res.status(404);
    throw new Error("Staff member not found");
  }
  user.staff = staff._id;
  await user.save();
  res.json({ success: true, data: await User.findById(user._id).select(USER_FIELDS).populate("staff", "staffId name designation") });
});

module.exports = { getUsers, getUser, createUser, updateUser, deactivateUser, resetPassword, linkStaff };
