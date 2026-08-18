const asyncHandler = require("../utils/asyncHandler");
const Booking = require("../models/Booking");

const getBookings = asyncHandler(async (req, res) => {
  const { status, source, from, to } = req.query;
  const query = {};
  if (status) query.status = status;
  if (source) query.source = source;
  if (from || to) {
    query.eventDate = {};
    if (from) query.eventDate.$gte = new Date(from);
    if (to) query.eventDate.$lte = new Date(to);
  }
  const bookings = await Booking.find(query).sort({ eventDate: 1 });
  res.json({ success: true, data: bookings });
});

// @desc  Calendar view - bookings between two dates, lightweight fields only
// @route GET /api/bookings/calendar?from=&to=
const getCalendar = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const query = {};
  if (from || to) {
    query.eventDate = {};
    if (from) query.eventDate.$gte = new Date(from);
    if (to) query.eventDate.$lte = new Date(to);
  }
  const bookings = await Booking.find(query)
    .select("customerName eventType eventDate eventTime guestCount status")
    .sort({ eventDate: 1 });
  res.json({ success: true, data: bookings });
});

const getBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }
  res.json({ success: true, data: booking });
});

const createBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.create({ ...req.body, source: "staff", createdBy: req.user ? req.user._id : undefined });
  res.status(201).json({ success: true, data: booking });
});

// @desc  Public party-booking request from the landing page (no auth)
// @route POST /api/bookings/online
const createOnlineBooking = asyncHandler(async (req, res) => {
  const { customerName, customerMobile, eventType, eventDate, eventTime, guestCount } = req.body;
  if (!customerName || !customerMobile || !eventType || !eventDate || !eventTime || !guestCount) {
    res.status(400);
    throw new Error("Please fill in all required booking details");
  }
  const booking = await Booking.create({
    ...req.body,
    eventDate: new Date(eventDate),
    totalAmount: req.body.totalAmount || 0,
    advancePaid: req.body.advancePaid || 0,
    source: "online",
    status: "enquiry",
  });
  res.status(201).json({ success: true, data: booking });
});

const updateBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }
  Object.assign(booking, req.body);
  await booking.save(); // triggers pre-save balanceAmount recalculation
  res.json({ success: true, data: booking });
});

const updateBookingStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;
  const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });
  if (!booking) {
    res.status(404);
    throw new Error("Booking not found");
  }
  res.json({ success: true, data: booking });
});

module.exports = { getBookings, getCalendar, getBooking, createBooking, createOnlineBooking, updateBooking, updateBookingStatus };
