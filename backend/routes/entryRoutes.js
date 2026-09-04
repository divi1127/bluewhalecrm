const express = require("express");
const {
  scanEntry,
  markExit,
  getActiveEntries,
  getTagStatus,
  searchCustomerForExtension,
  extendSession,
} = require("../controllers/entryController");
const { protect, access } = require("../middleware/auth");

const router = express.Router();

// TV display + wrist-tag verification page are public/kiosk - no auth required
router.get("/active", getActiveEntries);
router.get("/status/:tagId", getTagStatus);

router.use(protect);
router.post("/scan", access("entry", "create", "super_admin", "admin", "entry_staff"), scanEntry);
router.post("/exit", access("entry", "create", "super_admin", "admin", "entry_staff"), markExit);
router.get("/extend-search", access("entry", "view", "super_admin", "admin", "entry_staff"), searchCustomerForExtension);
router.post("/extend", access("entry", "edit", "super_admin", "admin", "entry_staff"), extendSession);

module.exports = router;
