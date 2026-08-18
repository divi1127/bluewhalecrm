const express = require("express");
const {
  checkIn,
  checkOut,
  markStatus,
  getAttendance,
  computeMonthlySalary,
  selfCheckIn,
  selfCheckOut,
  selfStatus,
  grantReLogin,
} = require("../controllers/attendanceController");
const { protect, authorize, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", requirePermission("attendance", "view"), getAttendance);
router.get("/me", requirePermission("attendance", "view"), selfStatus);
router.get("/salary/:staffId", authorize("super_admin", "admin", "hr_manager"), requirePermission("attendance", "view"), computeMonthlySalary);
router.post("/me/checkin", requirePermission("attendance", "create"), selfCheckIn);
router.post("/me/checkout", requirePermission("attendance", "create"), selfCheckOut);
router.post("/checkin", authorize("super_admin", "admin", "hr_manager"), requirePermission("attendance", "create"), checkIn);
router.post("/checkout", authorize("super_admin", "admin", "hr_manager"), requirePermission("attendance", "create"), checkOut);
router.post("/mark", authorize("super_admin", "admin", "hr_manager"), requirePermission("attendance", "create"), markStatus);
router.patch("/grant-relogin", authorize("super_admin"), grantReLogin);

module.exports = router;
