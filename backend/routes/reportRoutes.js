const express = require("express");
const {
  salesReport,
  customersReport,
  entriesReport,
  couponsReport,
  bookingsReport,
  staffReport,
} = require("../controllers/reportController");
const { protect, authorize, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.use(protect, authorize("super_admin", "admin"));
router.get("/sales", requirePermission("reports", "view"), salesReport);
router.get("/customers", requirePermission("reports", "view"), customersReport);
router.get("/entries", requirePermission("reports", "view"), entriesReport);
router.get("/coupons", requirePermission("reports", "view"), couponsReport);
router.get("/bookings", requirePermission("reports", "view"), bookingsReport);
router.get("/staff", requirePermission("reports", "view"), staffReport);

module.exports = router;
