const express = require("express");
const {
  getStaff,
  getStaffMember,
  createStaff,
  updateStaff,
  deactivateStaff,
  registerFace,
  clearFace,
  monthlySummary,
} = require("../controllers/staffController");
const { protect, access, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", requirePermission("staff", "view"), getStaff);
router.get("/monthly-summary", requirePermission("staff", "view"), monthlySummary);
router.get("/:id", requirePermission("staff", "view"), getStaffMember);
router.post("/", access("staff", "create", "super_admin", "admin", "hr_manager"), createStaff);
router.put("/:id", access("staff", "edit", "super_admin", "admin", "hr_manager"), updateStaff);
router.post("/:id/face", access("staff", "edit", "super_admin", "admin", "hr_manager"), registerFace);
router.delete("/:id/face", access("staff", "edit", "super_admin", "admin", "hr_manager"), clearFace);
router.delete("/:id", access("staff", "delete", "super_admin", "admin", "hr_manager"), deactivateStaff);

module.exports = router;
