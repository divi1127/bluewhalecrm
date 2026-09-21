const asyncHandler = require("../utils/asyncHandler");
const WristTag = require("../models/WristTag");
const Package = require("../models/Package");
const Customer = require("../models/Customer");

// Wrist-tag QRs encode a verification URL (`/scan-tag/<tagId>?zone=indoor|outdoor`).
// Extract both the clean tagId and the target zone if specified.
const extractTagInfo = (raw) => {
  const s = String(raw).trim();
  let zone = null;
  if (s.includes("zone=indoor") || s.includes("INDOOR") || s.includes("-IND")) zone = "indoor";
  if (s.includes("zone=outdoor") || s.includes("OUTDOOR") || s.includes("-OUT")) zone = "outdoor";

  let tagId = s;
  if (s.startsWith("{")) {
    try {
      tagId = JSON.parse(s).id || s;
    } catch {
      tagId = s;
    }
  }
  if (s.startsWith("http")) {
    const m = s.match(/\/scan-tag\/([^/?#]+)/);
    if (m) tagId = decodeURIComponent(m[1]);
    const q = s.match(/[?&]tagId=([^&]+)/);
    if (q) tagId = decodeURIComponent(q[1]);
  }
  // Strip -IND and -OUT suffixes from the base tagId
  tagId = tagId.replace(/-IND$|-OUT$/, "");
  
  return { tagId, zone };
};

const extractTagId = (raw) => extractTagInfo(raw).tagId;

const Bill = require("../models/Bill");

let latestTvEvent = null;

// Helper to calculate park-wide statistics
const getParkStats = async () => {
  const totalInside = await WristTag.countDocuments({
    status: { $in: ["INSIDE", "active"] },
  });
  const indoorCount = await WristTag.countDocuments({
    status: { $in: ["INSIDE", "active"] },
    $or: [
      { area: { $regex: /^indoor$/i } },
      { indoorStatus: { $in: ["INSIDE", "active"] } },
    ],
  });
  const outdoorCount = await WristTag.countDocuments({
    status: { $in: ["INSIDE", "active"] },
    $or: [
      { area: { $regex: /^outdoor$/i } },
      { outdoorStatus: { $in: ["INSIDE", "active"] } },
    ],
  });
  return { totalInside, indoorCount, outdoorCount };
};

// @desc  Entry staff scans a wrist-tag QR (Indoor or Outdoor). Validates single-use entry.
// @route POST /api/entry/scan
const scanEntry = asyncHandler(async (req, res) => {
  const { tagId: rawId, zone: explicitZone } = req.body;
  const { tagId, zone: extractedZone } = extractTagInfo(rawId);
  const selectedArea = explicitZone || extractedZone || "Indoor";
  const area = String(selectedArea).toLowerCase() === "outdoor" ? "Outdoor" : "Indoor";

  if (!tagId) {
    res.status(400);
    throw new Error("tagId is required");
  }

  const wristTag = await WristTag.findOne({ tagId })
    .populate("customer", "name mobile")
    .populate("package", "name durationMinutes")
    .populate("bill", "billNumber");

  if (!wristTag) {
    res.status(404);
    throw new Error("✕ UNKNOWN WRIST TAG");
  }

  // 1. Error handling: Already inside
  if (wristTag.status === "INSIDE" || wristTag.status === "active") {
    res.status(400);
    throw new Error("⚠ ALREADY INSIDE");
  }

  // 2. Error handling: Already exited (single-use band finished)
  if (wristTag.status === "EXITED" || wristTag.status === "exited") {
    res.status(400);
    throw new Error("⚠ ALREADY EXITED");
  }

  // 3. Mark as INSIDE
  const now = new Date();
  wristTag.status = "INSIDE";
  wristTag.area = area;
  wristTag.entryTime = now;
  if (area === "Indoor") {
    wristTag.indoorStatus = "INSIDE";
    wristTag.indoorEntryTime = now;
  } else {
    wristTag.outdoorStatus = "INSIDE";
    wristTag.outdoorEntryTime = now;
  }

  if (wristTag.package && wristTag.package.durationMinutes) {
    wristTag.expiryTime = new Date(now.getTime() + wristTag.package.durationMinutes * 60000);
  }

  await wristTag.save();

  // Find all members under this bill
  const billId = wristTag.bill?._id || wristTag.bill;
  const billTags = await WristTag.find({ bill: billId }).sort({ memberNumber: 1, createdAt: 1 });
  const totalMembers = billTags.length || 1;
  const insideCount = billTags.filter((t) => t.status === "INSIDE" || t.status === "active").length;

  const membersList = billTags.map((t, idx) => ({
    memberNumber: t.memberNumber || idx + 1,
    tagId: t.tagId,
    status: (t.status === "INSIDE" || t.status === "active") ? "INSIDE" : (t.status === "EXITED" || t.status === "exited") ? "EXITED" : "NOT ENTERED",
    area: t.area || (t.indoorStatus === "INSIDE" ? "Indoor" : t.outdoorStatus === "INSIDE" ? "Outdoor" : "Indoor"),
    entryTime: t.entryTime,
    exitTime: t.exitTime,
  }));

  const parkStats = await getParkStats();

  // Store scan event for instant TV Display temporary popup
  latestTvEvent = {
    id: Date.now(),
    type: "ENTRY",
    title: "✓ ENTRY SUCCESSFUL",
    billNumber: wristTag.bill?.billNumber || "N/A",
    memberNumber: wristTag.memberNumber || 1,
    tagId: wristTag.tagId,
    customerName: wristTag.customer?.name || "Guest",
    area,
    insideCount,
    totalMembers,
    timestamp: now,
  };

  res.json({
    success: true,
    message: "✓ ENTRY SUCCESSFUL",
    data: {
      tag: wristTag,
      billNumber: wristTag.bill?.billNumber || "N/A",
      memberNumber: wristTag.memberNumber || 1,
      area,
      insideCount,
      totalMembers,
      membersList,
      parkStats,
    },
  });
});

// @desc  Mark a wrist tag as exited
// @route POST /api/entry/exit
const markExit = asyncHandler(async (req, res) => {
  const { tagId: rawId } = req.body;
  const { tagId } = extractTagInfo(rawId);

  if (!tagId) {
    res.status(400);
    throw new Error("tagId is required");
  }

  const wristTag = await WristTag.findOne({ tagId })
    .populate("customer", "name mobile")
    .populate("package", "name durationMinutes")
    .populate("bill", "billNumber");

  if (!wristTag) {
    res.status(404);
    throw new Error("✕ UNKNOWN WRIST TAG");
  }

  // 1. Error handling: Exit without entering
  if (wristTag.status === "NOT_ENTERED" || wristTag.status === "unused" || !wristTag.entryTime) {
    res.status(400);
    throw new Error("⚠ INVALID EXIT");
  }

  // 2. Error handling: Already exited
  if (wristTag.status === "EXITED" || wristTag.status === "exited") {
    res.status(400);
    throw new Error("⚠ ALREADY EXITED");
  }

  const now = new Date();
  wristTag.status = "EXITED";
  wristTag.exitTime = now;
  wristTag.indoorStatus = "EXITED";
  wristTag.outdoorStatus = "EXITED";
  await wristTag.save();

  // Find all members under this bill
  const billId = wristTag.bill?._id || wristTag.bill;
  const billTags = await WristTag.find({ bill: billId }).sort({ memberNumber: 1, createdAt: 1 });
  const totalMembers = billTags.length || 1;
  const insideCount = billTags.filter((t) => t.status === "INSIDE" || t.status === "active").length;

  const membersList = billTags.map((t, idx) => ({
    memberNumber: t.memberNumber || idx + 1,
    tagId: t.tagId,
    status: (t.status === "INSIDE" || t.status === "active") ? "INSIDE" : (t.status === "EXITED" || t.status === "exited") ? "EXITED" : "NOT ENTERED",
    area: t.area || "Indoor",
    entryTime: t.entryTime,
    exitTime: t.exitTime,
  }));

  const parkStats = await getParkStats();

  // Store scan event for TV Display
  latestTvEvent = {
    id: Date.now(),
    type: "EXIT",
    title: "✓ EXIT SUCCESSFUL",
    billNumber: wristTag.bill?.billNumber || "N/A",
    memberNumber: wristTag.memberNumber || 1,
    tagId: wristTag.tagId,
    customerName: wristTag.customer?.name || "Guest",
    area: wristTag.area || "Indoor",
    insideCount,
    totalMembers,
    timestamp: now,
  };

  res.json({
    success: true,
    message: "✓ EXIT SUCCESSFUL",
    data: {
      tag: wristTag,
      billNumber: wristTag.bill?.billNumber || "N/A",
      memberNumber: wristTag.memberNumber || 1,
      area: wristTag.area || "Indoor",
      insideCount,
      totalMembers,
      membersList,
      parkStats,
    },
  });
});

// @desc  TV Display Live endpoint: live inside count + temporary scan notification
// @route GET /api/entry/tv-live
const getTvLiveData = asyncHandler(async (req, res) => {
  const parkStats = await getParkStats();

  // Return latest scan event if occurred within the last 6 seconds
  const isRecentEvent = latestTvEvent && (Date.now() - latestTvEvent.id < 6000);

  // Group active inside tags
  const insideTags = await WristTag.find({ status: { $in: ["INSIDE", "active"] } })
    .populate("customer", "name mobile")
    .populate("bill", "billNumber")
    .populate("package", "name durationMinutes")
    .sort({ entryTime: -1 });

  res.json({
    success: true,
    data: {
      ...parkStats,
      latestEvent: isRecentEvent ? latestTvEvent : null,
      insideTags,
    },
  });
});

// @desc  All currently active (inside the park) wrist tags - powers the TV display
// @route GET /api/entry/active
const getActiveEntries = asyncHandler(async (req, res) => {
  // Auto-expire any active tags whose time has run out
  await WristTag.updateMany(
    { status: "active", expiryTime: { $lte: new Date() } },
    { $set: { status: "expired" } }
  );

  const active = await WristTag.find({ status: { $in: ["active", "expired"] } })
    .populate("customer", "name mobile")
    .populate("package", "name")
    .sort({ expiryTime: 1 });

  res.json({ success: true, data: active });
});

// @desc  Lookup a single wrist tag's status (used by billing/entry UI to check before scanning,
//        and by the public /scan-tag page so a phone scan shows full details)
// @route GET /api/entry/status/:tagId
const getTagStatus = asyncHandler(async (req, res) => {
  const tagId = extractTagId(req.params.tagId);
  const wristTag = await WristTag.findOne({ tagId })
    .populate("customer", "name mobile")
    .populate("package", "name durationMinutes durationUnit")
    .populate("bill", "billNumber");
  if (!wristTag) {
    res.status(404);
    throw new Error("Ticket not found");
  }
  res.json({ success: true, data: wristTag });
});

// @desc  Search for a customer by name or mobile to find their active wrist tags for extension
// @route GET /api/entry/extend-search?q=
const searchCustomerForExtension = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    res.status(400);
    throw new Error("Search query must be at least 2 characters");
  }

  const searchRegex = new RegExp(q.trim(), "i");
  const customers = await Customer.find({
    $or: [{ name: searchRegex }, { mobile: searchRegex }],
  }).limit(10);

  if (customers.length === 0) {
    return res.json({ success: true, data: [] });
  }

  const customerIds = customers.map((c) => c._id);
  const activeTags = await WristTag.find({
    customer: { $in: customerIds },
    status: "active",
  })
    .populate("customer", "name mobile")
    .populate("package", "name durationMinutes");

  res.json({ success: true, data: activeTags });
});

// @desc  Extend an active wrist tag's session by additional minutes
// @route POST /api/entry/extend
const extendSession = asyncHandler(async (req, res) => {
  const { tagId, additionalMinutes } = req.body;

  if (!tagId) {
    res.status(400);
    throw new Error("tagId is required");
  }
  if (!additionalMinutes || additionalMinutes <= 0) {
    res.status(400);
    throw new Error("additionalMinutes must be a positive number");
  }

  const wristTag = await WristTag.findOne({ tagId })
    .populate("customer", "name mobile")
    .populate("package", "name durationMinutes");

  if (!wristTag) {
    res.status(404);
    throw new Error("Wrist tag not found");
  }

  if (wristTag.status !== "active") {
    res.status(400);
    throw new Error(`Cannot extend — tag status is "${wristTag.status}". Only active tags can be extended.`);
  }

  const currentExpiry = new Date(wristTag.expiryTime);
  const now = new Date();
  // Extend from now or from current expiry, whichever is later
  const baseTime = currentExpiry > now ? currentExpiry : now;
  wristTag.expiryTime = new Date(baseTime.getTime() + additionalMinutes * 60000);
  await wristTag.save();

  res.json({
    success: true,
    data: wristTag,
    message: `Session extended by ${additionalMinutes} minutes for ${wristTag.customer.name}. New expiry: ${wristTag.expiryTime.toLocaleTimeString("en-IN")}`,
  });
});

module.exports = {
  scanEntry,
  markExit,
  getActiveEntries,
  getTvLiveData,
  getTagStatus,
  searchCustomerForExtension,
  extendSession,
};
