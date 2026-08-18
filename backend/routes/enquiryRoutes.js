const express = require("express");
const {
  createPublicEnquiry,
  getEnquiries,
  getEnquiry,
  updateEnquiry,
  deleteEnquiry,
} = require("../controllers/enquiryController");
const { protect, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.post("/public", createPublicEnquiry);

router.use(protect);
router.get("/", requirePermission("enquiries", "view"), getEnquiries);
router.get("/:id", requirePermission("enquiries", "view"), getEnquiry);
router.put("/:id", requirePermission("enquiries", "edit"), updateEnquiry);
router.delete("/:id", requirePermission("enquiries", "delete"), deleteEnquiry);

module.exports = router;