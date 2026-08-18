const express = require("express");
const {
  scanEntry,
  markExit,
  getActiveEntries,
  getTagStatus,
} = require("../controllers/entryController");
const { protect, authorize, requirePermission } = require("../middleware/auth");

const router = express.Router();

// TV display + wrist-tag verification page are public/kiosk - no auth required
router.get("/active", getActiveEntries);
router.get("/status/:tagId", getTagStatus);

router.use(protect);
router.post("/scan", authorize("super_admin", "admin", "entry_staff"), requirePermission("entry", "create"), scanEntry);
router.post("/exit", authorize("super_admin", "admin", "entry_staff"), requirePermission("entry", "create"), markExit);

module.exports = router;
