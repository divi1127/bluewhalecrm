const express = require("express");
const {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
} = require("../controllers/packageController");
const { protect, authorize, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, requirePermission("packages", "view"), getPackages);
router.post("/", protect, authorize("super_admin", "admin"), requirePermission("packages", "create"), createPackage);
router.put("/:id", protect, authorize("super_admin"), requirePermission("packages", "edit"), updatePackage);
router.delete("/:id", protect, authorize("super_admin"), requirePermission("packages", "delete"), deletePackage);

module.exports = router;
