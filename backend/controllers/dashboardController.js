const asyncHandler = require("../utils/asyncHandler");
const Bill = require("../models/Bill");
const WristTag = require("../models/WristTag");
const Customer = require("../models/Customer");
const Booking = require("../models/Booking");
const CouponCode = require("../models/CouponCode");
const Attendance = require("../models/Attendance");
const Staff = require("../models/Staff");
const ExcelJS = require("exceljs");

const DAY = 86400000;
const pad = (n) => String(n).padStart(2, "0");
const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const monthKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;

const VALID_PERIODS = ["daily", "weekly", "monthly", "yearly", "custom"];

const startOfDay = (d = new Date()) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};

// current + previous (equal-length) windows for a period
const periodRanges = (period) => {
  const now = new Date();
  let from;
  if (period === "daily") from = startOfDay(now);
  else if (period === "weekly") from = new Date(startOfDay(now).getTime() - 6 * DAY);
  else if (period === "monthly") from = new Date(startOfDay(now).getTime() - 29 * DAY);
  else {
    from = startOfDay(now);
    from.setMonth(0, 1);
  }

  const len = now.getTime() - from.getTime();
  return {
    current: { from, to: now },
    previous: { from: new Date(from.getTime() - len), to: from },
  };
};

// custom from/to window (previous is the equal-length window before it)
const customRanges = (fromStr, toStr) => {
  const now = new Date();
  const from = fromStr ? startOfDay(new Date(fromStr)) : new Date(startOfDay(now).getTime() - 29 * DAY);
  const to = toStr ? new Date(toStr) : now;
  if (to <= from) {
    const swap = from;
    from = to;
    to = swap;
  }
  to.setHours(23, 59, 59, 999);
  const len = to.getTime() - from.getTime();
  return {
    current: { from, to },
    previous: { from: new Date(from.getTime() - len), to: from },
  };
};

// bucket labels for a custom range: hourly for <=1 day, daily for <= 90 days, else monthly
const buildCustomBuckets = (from, to) => {
  const buckets = [];
  const span = to.getTime() - from.getTime();
  if (span <= DAY) {
    for (let h = 0; h < 24; h++) buckets.push({ key: pad(h), label: `${pad(h)}:00` });
  } else if (span <= 90 * DAY) {
    const days = Math.round(span / DAY);
    for (let i = 0; i <= days; i++) {
      const d = new Date(from.getTime() + i * DAY);
      buckets.push({ key: dayKey(d), label: `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}` });
    }
  } else {
    let m = new Date(from.getFullYear(), from.getMonth(), 1);
    const endM = new Date(to.getFullYear(), to.getMonth(), 1);
    while (m <= endM) {
      buckets.push({ key: monthKey(m), label: m.toLocaleString("en", { month: "short" }) });
      m = new Date(m.getFullYear(), m.getMonth() + 1, 1);
    }
  }
  return buckets;
};

const customBucketKey = (date, from, to) => {
  const span = to.getTime() - from.getTime();
  if (span <= DAY) return pad(date.getHours());
  if (span <= 90 * DAY) return dayKey(date);
  return monthKey(date);
};

// bucket labels for a period's trend chart
const buildBuckets = (period) => {
  const now = new Date();
  const buckets = [];
  if (period === "daily") {
    for (let h = 0; h < 24; h++) buckets.push({ key: pad(h), label: `${pad(h)}:00` });
  } else if (period === "weekly" || period === "monthly") {
    const days = period === "weekly" ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(startOfDay(now).getTime() - i * DAY);
      buckets.push({ key: dayKey(d), label: `${d.getDate()} ${d.toLocaleString("en", { month: "short" })}` });
    }
  } else {
    for (let m = 0; m <= now.getMonth(); m++) {
      const d = new Date(now.getFullYear(), m, 1);
      buckets.push({ key: monthKey(d), label: d.toLocaleString("en", { month: "short" }) });
    }
  }
  return buckets;
};

const bucketKeyFor = (date, period) => {
  if (period === "daily") return pad(date.getHours());
  if (period === "yearly") return monthKey(date);
  return dayKey(date);
};

const toStats = ({ bills, wristTags, newCustomers, repeatCustomers, couponsUsed, bookings }) => ({
  sales: bills.reduce((s, b) => s + (b.finalAmount || 0), 0),
  bills: bills.length,
  visitors: bills.reduce((s, b) => s + (b.adults || 0) + (b.children || 0) + (b.below5 || 0), 0),
  entries: wristTags.filter((t) => t.entryTime).length,
  newCustomers,
  repeatCustomers,
  coupons: couponsUsed,
  bookings,
});

const loadDashboard = async ({ period, from, to }) => {
  const isCustom = period === "custom" || from || to;
  let current, previous;
  let buckets;
  let bucketKey;

  if (isCustom) {
    const ranges = customRanges(from, to);
    current = ranges.current;
    previous = ranges.previous;
    buckets = buildCustomBuckets(current.from, current.to);
    bucketKey = (date) => customBucketKey(date, current.from, current.to);
  } else {
    const ranges = periodRanges(period);
    current = ranges.current;
    previous = ranges.previous;
    buckets = buildBuckets(period);
    bucketKey = (date) => bucketKeyFor(date, period);
  }

  const [
    bills,
    wristTags,
    newCustomers,
    repeatCustomers,
    couponsUsed,
    bookings,
    prevBills,
    prevWristTags,
    prevNewCustomers,
    prevRepeatCustomers,
    prevCoupons,
    prevBookings,
    activeCustomers,
    staffList,
    attendanceToday,
  ] = await Promise.all([
    Bill.find({ createdAt: { $gte: current.from, $lte: current.to } }),
    WristTag.find({ createdAt: { $gte: current.from, $lte: current.to } }),
    Customer.countDocuments({ createdAt: { $gte: current.from, $lte: current.to } }),
    Customer.countDocuments({ lastVisitDate: { $gte: current.from, $lte: current.to }, totalVisits: { $gt: 1 } }),
    CouponCode.countDocuments({ used: true, usedAt: { $gte: current.from, $lte: current.to } }),
    Booking.countDocuments({ eventDate: { $gte: current.from, $lte: current.to }, status: { $ne: "cancelled" } }),
    Bill.find({ createdAt: { $gte: previous.from, $lt: previous.to } }),
    WristTag.find({ createdAt: { $gte: previous.from, $lt: previous.to } }),
    Customer.countDocuments({ createdAt: { $gte: previous.from, $lt: previous.to } }),
    Customer.countDocuments({ lastVisitDate: { $gte: previous.from, $lt: previous.to }, totalVisits: { $gt: 1 } }),
    CouponCode.countDocuments({ used: true, usedAt: { $gte: previous.from, $lt: previous.to } }),
    Booking.countDocuments({ eventDate: { $gte: previous.from, $lt: previous.to }, status: { $ne: "cancelled" } }),
    WristTag.countDocuments({ status: "active" }),
    Staff.find({ active: true }),
    Attendance.find({ date: new Date().toISOString().slice(0, 10) }),
  ]);

  const currentStats = toStats({ bills, wristTags, newCustomers, repeatCustomers, couponsUsed, bookings });
  const previousStats = toStats({
    bills: prevBills,
    wristTags: prevWristTags,
    newCustomers: prevNewCustomers,
    repeatCustomers: prevRepeatCustomers,
    couponsUsed: prevCoupons,
    bookings: prevBookings,
  });

  // trend data (sales + visitors) bucketed for the period
  const salesMap = {};
  const visitorsMap = {};
  for (const b of bills) {
    const k = bucketKey(b.createdAt);
    salesMap[k] = (salesMap[k] || 0) + (b.finalAmount || 0);
    visitorsMap[k] = (visitorsMap[k] || 0) + (b.adults || 0) + (b.children || 0) + (b.below5 || 0);
  }
  const salesTrend = buckets.map((x) => ({ label: x.label, value: Math.round(salesMap[x.key] || 0) }));
  const visitorsTrend = buckets.map((x) => ({ label: x.label, value: visitorsMap[x.key] || 0 }));

  // last-12-months month list (UTC based to match $year/$month aggregation)
  const monthList = [];
  const nowUtc = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(nowUtc.getUTCFullYear(), nowUtc.getUTCMonth() - i, 1));
    monthList.push({
      key: `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`,
      label: d.toLocaleString("en", { month: "short" }),
    });
  }

  const [
    paymentModeAgg,
    bookingStatusAgg,
    entryStatusAgg,
    customerMixAgg,
    packageAgg,
    monthlyAgg,
  ] = await Promise.all([
    Bill.aggregate([
      { $match: { createdAt: { $gte: current.from, $lte: current.to } } },
      { $group: { _id: "$paymentMode", value: { $sum: "$finalAmount" }, count: { $sum: 1 } } },
    ]),
    Booking.aggregate([
      { $match: { eventDate: { $gte: current.from, $lte: current.to } } },
      { $group: { _id: "$status", value: { $sum: 1 } } },
    ]),
    WristTag.aggregate([
      { $match: { createdAt: { $gte: current.from, $lte: current.to } } },
      { $group: { _id: "$status", value: { $sum: 1 } } },
    ]),
    Customer.aggregate([{ $group: { _id: "$customerType", value: { $sum: 1 } } }]),
    Bill.aggregate([
      { $match: { createdAt: { $gte: current.from, $lte: current.to } } },
      { $group: { _id: "$package", value: { $sum: "$finalAmount" } } },
      { $sort: { value: -1 } },
      { $limit: 8 },
      {
        $lookup: {
          from: "packages",
          localField: "_id",
          foreignField: "_id",
          as: "pkg",
        },
      },
    ]),
    Bill.aggregate([
      { $match: { createdAt: { $gte: new Date(monthList[0].key + "-01T00:00:00.000Z") } } },
      {
        $group: {
          _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" } },
          value: { $sum: "$finalAmount" },
        },
      },
    ]),
  ]);

  const monthMap = {};
  monthlyAgg.forEach((r) => {
    monthMap[`${r._id.y}-${pad(r._id.m)}`] = Math.round(r.value);
  });
  const last12MonthsSales = monthList.map((m) => ({ label: m.label, value: monthMap[m.key] || 0 }));

  const paymentModes = paymentModeAgg.map((r) => ({ name: r._id, value: Math.round(r.value), count: r.count }));
  const bookingStatus = bookingStatusAgg.map((r) => ({ name: r._id, value: r.value }));
  const entryStatus = entryStatusAgg.map((r) => ({ name: r._id, value: r.value }));
  const customerMix = customerMixAgg.map((r) => ({ name: r._id || "unknown", value: r.value }));
  const packageRevenue = packageAgg.map((r) => ({
    name: r.pkg && r.pkg[0] ? r.pkg[0].name : "Unknown",
    value: Math.round(r.value),
  }));

  const presentCount = attendanceToday.filter((a) => a.status === "present").length;

  return {
    period: isCustom ? "custom" : period,
    isCustom,
    range: { from: current.from, to: current.to },
    previousRange: previous,
    current: currentStats,
    previous: previousStats,
    activeCustomers,
    staffPresentToday: presentCount,
    staffTotal: staffList.length,
    charts: {
      salesTrend,
      visitorsTrend,
      paymentModes,
      bookingStatus,
      entryStatus,
      customerMix,
      packageRevenue,
      last12MonthsSales,
    },
  };
};

// @desc  Aggregated metrics + analysis data for the admin dashboard
// @route GET /api/dashboard?period=daily|weekly|monthly|yearly|custom&from=&to=
const getDashboard = asyncHandler(async (req, res) => {
  const period = VALID_PERIODS.includes(req.query.period) ? req.query.period : "daily";
  const data = await loadDashboard({
    period,
    from: req.query.from,
    to: req.query.to,
  });
  res.json({ success: true, data });
});

// @desc  Export the dashboard metrics + charts as an .xlsx workbook
// @route GET /api/dashboard/export?period=&from=&to=
const exportDashboard = asyncHandler(async (req, res) => {
  const period = VALID_PERIODS.includes(req.query.period) ? req.query.period : "daily";
  const d = await loadDashboard({
    period,
    from: req.query.from,
    to: req.query.to,
  });

  const wb = new ExcelJS.Workbook();
  wb.creator = "BlueWhale";
  wb.created = new Date();

  const headerStyle = { font: { bold: true, color: { argb: "FFFFFFFF" } }, fill: { type: "pattern", pattern: "solid", fgColor: { argb: "FF276E8C" } } };
  const titleStyle = { font: { bold: true, size: 14, color: { argb: "FF1C5570" } } };

  const labelColumn = { header: "Metric", key: "metric", width: 28 };
  const valueColumn = { header: "Value", key: "value", width: 18 };
  const nameColumn = { header: "Name", key: "name", width: 24 };
  const countColumn = { header: "Count", key: "count", width: 12 };

  // --- Summary sheet ---
  const summary = wb.addWorksheet("Summary");
  summary.addRow(["Dashboard Summary"]).getCell(1, 1).style = titleStyle;
  summary.addRow([]);
  summary.addRow([`Period: ${d.period}`, `From: ${d.range.from.toLocaleString()}`, `To: ${d.range.to.toLocaleString()}`]);
  summary.addRow([]);
  summary.addRow([labelColumn.header, valueColumn.header]);
  const rows = [
    ["Sales", d.current.sales],
    ["Bills", d.current.bills],
    ["Visitors / Walk-ins", d.current.visitors],
    ["Entries", d.current.entries],
    ["New Customers", d.current.newCustomers],
    ["Repeat Customers", d.current.repeatCustomers],
    ["Coupons Redeemed", d.current.coupons],
    ["Party Bookings", d.current.bookings],
    ["Active Customers", d.activeCustomers],
    ["Staff Present Today", `${d.staffPresentToday} / ${d.staffTotal}`],
  ];
  rows.forEach((r, i) => summary.addRow(r));
  summary.getRow(5).eachCell((c) => (c.style = headerStyle));
  summary.columns = [{ width: 28 }, { width: 18 }];

  // --- Revenue Trend ---
  const revenueWs = wb.addWorksheet("Revenue Trend");
  revenueWs.addRow(["Revenue Trend"]).getCell(1, 1).style = titleStyle;
  revenueWs.addRow([]);
  revenueWs.addRow([labelColumn.header, valueColumn.header]);
  d.charts.salesTrend.forEach((x) => revenueWs.addRow([x.label, x.value]));
  revenueWs.getRow(3).eachCell((c) => (c.style = headerStyle));

  // --- Visitors Trend ---
  const visitorsWs = wb.addWorksheet("Visitors Trend");
  visitorsWs.addRow(["Visitors Trend"]).getCell(1, 1).style = titleStyle;
  visitorsWs.addRow([]);
  visitorsWs.addRow([labelColumn.header, valueColumn.header]);
  d.charts.visitorsTrend.forEach((x) => visitorsWs.addRow([x.label, x.value]));
  visitorsWs.getRow(3).eachCell((c) => (c.style = headerStyle));

  // --- Revenue by Package ---
  const pkgWs = wb.addWorksheet("Revenue by Package");
  pkgWs.addRow(["Revenue by Package"]).getCell(1, 1).style = titleStyle;
  pkgWs.addRow([]);
  pkgWs.addRow([nameColumn.header, valueColumn.header]);
  d.charts.packageRevenue.forEach((x) => pkgWs.addRow([x.name, x.value]));
  pkgWs.getRow(3).eachCell((c) => (c.style = headerStyle));

  // --- Payment Modes ---
  const payWs = wb.addWorksheet("Payment Modes");
  payWs.addRow(["Payment Modes"]).getCell(1, 1).style = titleStyle;
  payWs.addRow([]);
  payWs.addRow([nameColumn.header, valueColumn.header, countColumn.header]);
  d.charts.paymentModes.forEach((x) => payWs.addRow([x.name, x.value, x.count]));
  payWs.getRow(3).eachCell((c) => (c.style = headerStyle));

  // --- Bookings by Status ---
  const bookingWs = wb.addWorksheet("Bookings by Status");
  bookingWs.addRow(["Bookings by Status"]).getCell(1, 1).style = titleStyle;
  bookingWs.addRow([]);
  bookingWs.addRow([nameColumn.header, valueColumn.header]);
  d.charts.bookingStatus.forEach((x) => bookingWs.addRow([x.name, x.value]));
  bookingWs.getRow(3).eachCell((c) => (c.style = headerStyle));

  // --- Entry Status ---
  const entryWs = wb.addWorksheet("Entry Status");
  entryWs.addRow(["Entry Status"]).getCell(1, 1).style = titleStyle;
  entryWs.addRow([]);
  entryWs.addRow([nameColumn.header, valueColumn.header]);
  d.charts.entryStatus.forEach((x) => entryWs.addRow([x.name, x.value]));
  entryWs.getRow(3).eachCell((c) => (c.style = headerStyle));

  // --- Customer Mix ---
  const custWs = wb.addWorksheet("Customer Mix");
  custWs.addRow(["Customer Mix"]).getCell(1, 1).style = titleStyle;
  custWs.addRow([]);
  custWs.addRow([nameColumn.header, valueColumn.header]);
  d.charts.customerMix.forEach((x) => custWs.addRow([x.name, x.value]));
  custWs.getRow(3).eachCell((c) => (c.style = headerStyle));

  // --- Last 12 Months Sales ---
  const monthsWs = wb.addWorksheet("Last 12 Months Sales");
  monthsWs.addRow(["Last 12 Months Sales"]).getCell(1, 1).style = titleStyle;
  monthsWs.addRow([]);
  monthsWs.addRow([labelColumn.header, valueColumn.header]);
  d.charts.last12MonthsSales.forEach((x) => monthsWs.addRow([x.label, x.value]));
  monthsWs.getRow(3).eachCell((c) => (c.style = headerStyle));

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename="dashboard-${Date.now()}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

module.exports = { getDashboard, exportDashboard };