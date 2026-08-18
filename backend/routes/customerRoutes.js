const express = require("express");
const {
  getCustomers,
  lookupByMobile,
  getCustomer,
  createCustomer,
  updateCustomer,
  getFollowUpList,
  markFollowUp,
} = require("../controllers/customerController");
const { protect, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.use(protect);
router.get("/", requirePermission("customers", "view"), getCustomers);
router.get("/followup/list", requirePermission("customers", "view"), getFollowUpList);
router.get("/lookup/:mobile", requirePermission("customers", "view"), lookupByMobile);
router.get("/:id", requirePermission("customers", "view"), getCustomer);
router.post("/", requirePermission("customers", "create"), createCustomer);
router.put("/:id", requirePermission("customers", "edit"), updateCustomer);
router.post("/:id/followup", requirePermission("customers", "edit"), markFollowUp);

module.exports = router;
