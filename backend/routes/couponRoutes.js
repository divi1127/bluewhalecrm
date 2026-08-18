const express = require("express");
const {
  createCoupon,
  getCoupons,
  updateCoupon,
  generateCodes,
  verifyCode,
  getCouponPerformance,
} = require("../controllers/couponController");
const { protect, authorize, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", requirePermission("coupons", "view"), getCoupons);
router.get("/verify/:code", requirePermission("coupons", "view"), verifyCode);
router.get("/:id/performance", requirePermission("coupons", "view"), getCouponPerformance);
router.post("/", authorize("super_admin", "admin"), requirePermission("coupons", "create"), createCoupon);
router.put("/:id", authorize("super_admin", "admin"), requirePermission("coupons", "edit"), updateCoupon);
router.post("/:id/generate-codes", authorize("super_admin", "admin"), requirePermission("coupons", "create"), generateCodes);

module.exports = router;
