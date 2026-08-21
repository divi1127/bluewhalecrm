const express = require("express");
const {
  checkIn,
  checkOut,
  markStatus,
  getAttendance,
  getAttendanceSummary,
  computeMonthlySalary,
  selfCheckIn,
  selfCheckOut,
  selfStatus,
  grantReLogin,
} = require("../controllers/attendanceController");
const { protect, access, authorize, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", requirePermission("attendance", "view"), getAttendance);
router.get("/summary", requirePermission("attendance", "view"), getAttendanceSummary);
router.get("/me", requirePermission("attendance", "view"), selfStatus);
router.get("/salary/:staffId", access("attendance", "view", "super_admin", "admin", "hr_manager"), computeMonthlySalary);
router.post("/me/checkin", requirePermission("attendance", "create"), selfCheckIn);
router.post("/me/checkout", requirePermission("attendance", "create"), selfCheckOut);
router.post("/checkin", access("attendance", "create", "super_admin", "admin", "hr_manager"), checkIn);
router.post("/checkout", access("attendance", "create", "super_admin", "admin", "hr_manager"), checkOut);
router.post("/mark", access("attendance", "create", "super_admin", "admin", "hr_manager"), markStatus);
router.patch("/grant-relogin", authorize("super_admin"), grantReLogin);

module.exports = router;
