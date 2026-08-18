const express = require("express");
const {
  createBill,
  verifyCoupon,
  getBill,
  getBills,
  getCustomerHistory,
} = require("../controllers/billingController");
const { protect, authorize, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", requirePermission("billing_history", "view"), getBills);
router.post("/verify-coupon", requirePermission("billing", "view"), verifyCoupon);
router.get("/customer/:customerId", requirePermission("billing_history", "view"), getCustomerHistory);
router.get("/:id", requirePermission("billing_history", "view"), getBill);
router.post("/", authorize("super_admin", "admin", "billing_staff", "cashier"), requirePermission("billing", "create"), createBill);

module.exports = router;
