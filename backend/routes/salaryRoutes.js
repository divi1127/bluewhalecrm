const express = require("express");
const { monthlySummary, staffSalary } = require("../controllers/salaryController");
const { protect, access } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/summary", access("salary", "view", "super_admin", "admin", "hr_manager"), monthlySummary);
router.get("/staff/:staffId", access("salary", "view", "super_admin", "admin", "hr_manager"), staffSalary);

module.exports = router;
