const express = require("express");
const {
  createCoupon,
  getCoupons,
  updateCoupon,
  generateCodes,
  verifyCode,
  getCouponPerformance,
} = require("../controllers/couponController");
const { protect, access, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", requirePermission("coupons", "view"), getCoupons);
router.get("/verify/:code", requirePermission("coupons", "view"), verifyCode);
router.get("/:id/performance", requirePermission("coupons", "view"), getCouponPerformance);
router.post("/", access("coupons", "create", "super_admin", "admin"), createCoupon);
router.put("/:id", access("coupons", "edit", "super_admin", "admin"), updateCoupon);
router.post("/:id/generate-codes", access("coupons", "create", "super_admin", "admin"), generateCodes);

module.exports = router;
