const asyncHandler = require("../utils/asyncHandler");
const Bill = require("../models/Bill");
const Customer = require("../models/Customer");
const WristTag = require("../models/WristTag");
const CouponCode = require("../models/CouponCode");
const Coupon = require("../models/Coupon");
const Booking = require("../models/Booking");
const Attendance = require("../models/Attendance");

const dateRangeQuery = (from, to, field = "createdAt") => {
  const q = {};
  if (from || to) {
    q[field] = {};
    if (from) q[field].$gte = new Date(from);
    if (to) q[field].$lte = new Date(to);
  }
  return q;
};

// @desc  Sales report: totals by day/package/payment mode/staff within a range
// @route GET /api/reports/sales?from=&to=
const salesReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const bills = await Bill.find(dateRangeQuery(from, to))
    .populate("package", "name")
    .populate("createdBy", "name");

  const totalRevenue = bills.reduce((s, b) => s + b.finalAmount, 0);

  const byPackage = {};
  const byPaymentMode = {};
  const byStaff = {};
  const byDay = {};

  for (const b of bills) {
    const pkgName = b.package ? b.package.name : "Unknown";
    byPackage[pkgName] = (byPackage[pkgName] || 0) + b.finalAmount;
    byPaymentMode[b.paymentMode] = (byPaymentMode[b.paymentMode] || 0) + b.finalAmount;
    const staffName = b.createdBy ? b.createdBy.name : "Unknown";
    byStaff[staffName] = (byStaff[staffName] || 0) + b.finalAmount;
    const day = b.createdAt.toISOString().slice(0, 10);
    byDay[day] = (byDay[day] || 0) + b.finalAmount;
  }

  res.json({
    success: true,
    data: { totalRevenue, totalBills: bills.length, byPackage, byPaymentMode, byStaff, byDay },
  });
});

// @desc  Customer report: new/repeat/inactive/most-visited/high-spending
// @route GET /api/reports/customers
const customersReport = asyncHandler(async (req, res) => {
  const [newCount, repeatCount, inactiveCount, mostVisited, topSpenders] = await Promise.all([
    Customer.countDocuments({ customerType: "new" }),
    Customer.countDocuments({ customerType: { $in: ["regular", "vip"] } }),
    Customer.countDocuments({ customerType: "inactive" }),
    Customer.find().sort({ totalVisits: -1 }).limit(10),
    Customer.find().sort({ totalSpending: -1 }).limit(10),
  ]);

  res.json({
    success: true,
    data: { newCount, repeatCount, inactiveCount, mostVisited, topSpenders },
  });
});

// @desc  Entry report: total entries, active, expired, package-wise breakdown
// @route GET /api/reports/entries?from=&to=
const entriesReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const tags = await WristTag.find(dateRangeQuery(from, to)).populate("package", "name");

  const totalEntries = tags.filter((t) => t.entryTime).length;
  const active = tags.filter((t) => t.status === "active").length;
  const expired = tags.filter((t) => t.status === "expired").length;

  const byPackage = {};
  for (const t of tags) {
    const pkgName = t.package ? t.package.name : "Unknown";
    byPackage[pkgName] = (byPackage[pkgName] || 0) + 1;
  }

  res.json({ success: true, data: { totalEntries, active, expired, byPackage } });
});

// @desc  Coupon report: issued/redeemed/partner-wise/revenue
// @route GET /api/reports/coupons
const couponsReport = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find();
  const results = [];
  for (const c of coupons) {
    const codes = await CouponCode.find({ coupon: c._id }).populate("usedBill", "finalAmount");
    const issued = codes.length;
    const used = codes.filter((code) => code.used).length;
    const revenue = codes.reduce((sum, code) => sum + (code.usedBill ? code.usedBill.finalAmount : 0), 0);
    results.push({ partnerName: c.partnerName, campaignName: c.campaignName, issued, used, revenue });
  }
  res.json({ success: true, data: results });
});

// @desc  Bookings report: total/confirmed/pending/cancelled and party revenue
// @route GET /api/reports/bookings?from=&to=
const bookingsReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const bookings = await Booking.find(dateRangeQuery(from, to, "eventDate"));

  const total = bookings.length;
  const confirmed = bookings.filter((b) => b.status === "confirmed").length;
  const pending = bookings.filter((b) => ["enquiry", "advance_paid"].includes(b.status)).length;
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;
  const revenue = bookings
    .filter((b) => b.status !== "cancelled")
    .reduce((sum, b) => sum + b.totalAmount, 0);

  res.json({ success: true, data: { total, confirmed, pending, cancelled, revenue } });
});

// @desc  Staff report: attendance/leave/overtime summary within a range
// @route GET /api/reports/staff?from=&to=
const staffReport = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const query = {};
  if (from || to) {
    query.date = {};
    if (from) query.date.$gte = from;
    if (to) query.date.$lte = to;
  }
  const records = await Attendance.find(query).populate("staff", "name designation");

  const present = records.filter((r) => r.status === "present").length;
  const absent = records.filter((r) => r.status === "absent").length;
  const halfDay = records.filter((r) => r.status === "half-day").length;
  const leave = records.filter((r) => r.status === "leave").length;
  const totalOvertimeHours = records.reduce((sum, r) => sum + (r.overtimeHours || 0), 0);

  res.json({ success: true, data: { present, absent, halfDay, leave, totalOvertimeHours, records } });
});

module.exports = {
  salesReport,
  customersReport,
  entriesReport,
  couponsReport,
  bookingsReport,
  staffReport,
};
