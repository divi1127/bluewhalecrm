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

module.exports = { protect, authorize, requirePermission, hasPermission };
