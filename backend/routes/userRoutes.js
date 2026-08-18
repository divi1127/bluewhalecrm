const express = require("express");
const {
  getUsers,
  getUser,
  createUser,
  updateUser,
  deactivateUser,
  resetPassword,
  linkStaff,
} = require("../controllers/userController");
const { protect, authorize, requirePermission } = require("../middleware/auth");

const router = express.Router();

// All user/access management is super-admin only (permission checks are belt-and-suspenders)
router.use(protect, authorize("super_admin"));

router.get("/", requirePermission("users", "view"), getUsers);
router.get("/:id", requirePermission("users", "view"), getUser);
router.post("/", requirePermission("users", "create"), createUser);
router.put("/:id", requirePermission("users", "edit"), updateUser);
router.delete("/:id", requirePermission("users", "delete"), deactivateUser);
router.post("/:id/reset-password", requirePermission("users", "edit"), resetPassword);
router.post("/:id/link-staff", requirePermission("users", "edit"), linkStaff);

module.exports = router;
