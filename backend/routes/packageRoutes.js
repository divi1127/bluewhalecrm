const express = require("express");
const {
  getPackages,
  createPackage,
  updatePackage,
  deletePackage,
} = require("../controllers/packageController");
const { protect, access, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, requirePermission("packages", "view"), getPackages);
router.post("/", protect, access("packages", "create", "super_admin", "admin"), createPackage);
router.put("/:id", protect, access("packages", "edit", "super_admin"), updatePackage);
router.delete("/:id", protect, access("packages", "delete", "super_admin"), deletePackage);

module.exports = router;
