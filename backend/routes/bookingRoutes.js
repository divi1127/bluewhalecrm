const express = require("express");
const {
  getBookings,
  getCalendar,
  getBooking,
  createBooking,
  createOnlineBooking,
  updateBooking,
  updateBookingStatus,
} = require("../controllers/bookingController");
const { protect, requirePermission } = require("../middleware/auth");

const router = express.Router();

router.post("/online", createOnlineBooking);

router.use(protect);
router.get("/", requirePermission("bookings", "view"), getBookings);
router.get("/calendar", requirePermission("bookings", "view"), getCalendar);
router.get("/:id", requirePermission("bookings", "view"), getBooking);
router.post("/", requirePermission("bookings", "create"), createBooking);
router.put("/:id", requirePermission("bookings", "edit"), updateBooking);
router.patch("/:id/status", requirePermission("bookings", "edit"), updateBookingStatus);

module.exports = router;
