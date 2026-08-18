const express = require("express");
const {
  getAttendanceSettings,
  updateAttendanceSettings,
} = require("../controllers/settingsController");
const { protect, authorize, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/attendance", requirePermission("settings", "view"), getAttendanceSettings);
router.put("/attendance", authorize("super_admin", "admin"), requirePermission("settings", "edit"), updateAttendanceSettings);

module.exports = router;
