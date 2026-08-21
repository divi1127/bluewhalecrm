const express = require("express");
const {
  scanEntry,
  markExit,
  getActiveEntries,
  getTagStatus,
} = require("../controllers/entryController");
const { protect, access } = require("../middleware/auth");

const router = express.Router();

// TV display + wrist-tag verification page are public/kiosk - no auth required
router.get("/active", getActiveEntries);
router.get("/status/:tagId", getTagStatus);

router.use(protect);
router.post("/scan", access("entry", "create", "super_admin", "admin", "entry_staff"), scanEntry);
router.post("/exit", access("entry", "create", "super_admin", "admin", "entry_staff"), markExit);

module.exports = router;
