const express = require("express");
const { getDashboard, exportDashboard } = require("../controllers/dashboardController");
const { protect, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, requirePermission("dashboard", "view"), getDashboard);
router.get("/export", protect, requirePermission("dashboard", "view"), exportDashboard);

module.exports = router;