const express = require("express");
const {
  salesReport,
  customersReport,
  entriesReport,
  couponsReport,
  bookingsReport,
  staffReport,
} = require("../controllers/reportController");
const { protect, access } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/sales", access("reports", "view", "super_admin", "admin"), salesReport);
router.get("/customers", access("reports", "view", "super_admin", "admin"), customersReport);
router.get("/entries", access("reports", "view", "super_admin", "admin"), entriesReport);
router.get("/coupons", access("reports", "view", "super_admin", "admin"), couponsReport);
router.get("/bookings", access("reports", "view", "super_admin", "admin"), bookingsReport);
router.get("/staff", access("reports", "view", "super_admin", "admin"), staffReport);

module.exports = router;
