const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const User = require("../models/User");

// Verifies the JWT on the Authorization header and attaches req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith("Bearer")) {
    token = authHeader.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user || !req.user.active) {
      res.status(401);
      throw new Error("Not authorized, user not found or inactive");
    }
    next();
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, token invalid or expired");
  }
});

// Restricts a route to a set of roles, e.g. authorize("super_admin", "admin")
const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    res.status(403);
    throw new Error(`Role '${req.user ? req.user.role : "unknown"}' is not permitted to access this resource`);
  }
  next();
};

// Permission helper shared with the frontend `can()` helper:
// - super_admin always passes.
// - Empty permissions ([] or {}) => full access by role (legacy behaviour).
// - Legacy array of module keys => view-only access to the listed modules.
// - Object { module: { view, create, edit, delete } } => checked per action.
const hasPermission = (user, moduleKey, action) => {
  if (!user || user.role === "super_admin") return true;
  const perms = user.permissions;
  const empty = !perms || (Array.isArray(perms) ? perms.length === 0 : Object.keys(perms).length === 0);
  if (empty) return true;
  if (Array.isArray(perms)) return action === "view" && perms.includes(moduleKey);
  return !!(perms[moduleKey] && perms[moduleKey][action]);
};

// Restricts a route by module action, e.g. requirePermission("coupons", "edit")
const requirePermission = (moduleKey, action) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
  if (!hasPermission(req.user, moduleKey, action)) {
    res.status(403);
    throw new Error(`You do not have permission to ${action} this module`);
  }
  next();
};

// Combined role + permission gate, e.g. access("entry", "create", "super_admin", "admin", "entry_staff")
// - super_admin always passes.
// - User with explicit object permissions: the grant decides, even if their role
//   is not in the whitelist (so Control > module access works for any user).
// - User without explicit permissions (empty or legacy array): falls back to the
//   role whitelist; legacy arrays may also grant view-only access.
const access = (moduleKey, action, ...roles) => (req, res, next) => {
  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }
  const user = req.user;
  if (user.role === "super_admin") return next();

  const perms = user.permissions;
  const explicit =
    perms && !Array.isArray(perms) && Object.keys(perms).length > 0;

  if (explicit) {
    if (perms[moduleKey] && perms[moduleKey][action]) return next();
    res.status(403);
    throw new Error(`You do not have permission to ${action} this module`);
  }

  const roleOk = roles.includes(user.role);
  if (roleOk) return next();

  // Legacy array permissions could only ever widen view access for whitelisted
  // roles, so keep them working for non-whitelisted roles too.
  if (
    action === "view" &&
    Array.isArray(perms) &&
    perms.length > 0 &&
    perms.includes(moduleKey)
  ) {
    return next();
  }

  res.status(403);
  throw new Error(
    `Role '${user.role}' is not permitted to access this resource`
  );
};

module.exports = { protect, authorize, requirePermission, hasPermission, access };
