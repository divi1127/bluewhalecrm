const express = require("express");
const {
  getStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  deactivateStaff,
  registerFace,
  clearFace,
} = require("../controllers/staffController");
const { protect, authorize, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", requirePermission("staff", "view"), getStaff);
router.get("/:id", requirePermission("staff", "view"), getStaffMember);
router.post("/", authorize("super_admin", "admin", "hr_manager"), requirePermission("staff", "create"), createStaff);
router.put("/:id", authorize("super_admin", "admin", "hr_manager"), requirePermission("staff", "edit"), updateStaff);
router.post("/:id/face", authorize("super_admin", "admin", "hr_manager"), requirePermission("staff", "edit"), registerFace);
router.delete("/:id/face", authorize("super_admin", "admin", "hr_manager"), requirePermission("staff", "edit"), clearFace);
router.delete("/:id", authorize("super_admin", "admin", "hr_manager"), requirePermission("staff", "delete"), deactivateStaff);

module.exports = router;
