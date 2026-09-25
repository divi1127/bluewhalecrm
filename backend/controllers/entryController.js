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

// ── Zone helpers: indoor/outdoor each have independent entry & exit ──
const zoneField = (t, area, suffix) =>
  t[area === "Outdoor" ? `outdoor${suffix}` : `indoor${suffix}`];

const zoneStatus = (t, area) => zoneField(t, area, "Status");
const zoneEntryTime = (t, area) => zoneField(t, area, "EntryTime");
const zoneExitTime = (t, area) => zoneField(t, area, "ExitTime");

const zoneIncluded = (s) => ["INSIDE", "active"].includes(s);
const zoneFinished = (s) => ["EXITED", "exited"].includes(s);
const zoneFresh = (s) => !s || ["NOT_ENTERED", "unused"].includes(s);

const isZoneActive = (t, area) => zoneIncluded(zoneStatus(t, area));
const isZoneDone = (t, area) => zoneFinished(zoneStatus(t, area));
const isZoneEntered = (t, area) => !zoneFresh(zoneStatus(t, area));
const bothZonesDone = (t) => isZoneDone(t, "Indoor") && isZoneDone(t, "Outdoor");
const anyZoneActive = (t) => isZoneActive(t, "Indoor") || isZoneActive(t, "Outdoor");

const memberStatus = (t) =>
  bothZonesDone(t)
    ? "EXITED"
    : anyZoneActive(t) || t.entryTime
      ? "INSIDE"
      : "NOT ENTERED";

const memberArea = (t) => {
  if (isZoneActive(t, "Indoor")) return "Indoor";
  if (isZoneActive(t, "Outdoor")) return "Outdoor";
  if (isZoneDone(t, "Indoor")) return "Indoor";
  if (isZoneDone(t, "Outdoor")) return "Outdoor";
  return t.area || "Indoor";
};

const buildMembersList = (billTags) =>
  billTags.map((t, idx) => ({
    memberNumber: t.memberNumber || idx + 1,
    tagId: t.tagId,
    status: memberStatus(t),
    area: memberArea(t),
    entryTime: t.entryTime,
    exitTime: t.exitTime,
  }));

const countInside = (billTags) => billTags.filter((t) => memberStatus(t) === "INSIDE").length;

let latestTvEvent = null;

// Helper to calculate park-wide statistics (per-zone, independent entries)
const getParkStats = async () => {
  const totalInside = await WristTag.countDocuments({
    status: { $in: ["INSIDE", "active"] },
  });
  const indoorCount = await WristTag.countDocuments({
    indoorStatus: { $in: ["INSIDE", "active"] },
  });
  const outdoorCount = await WristTag.countDocuments({
    outdoorStatus: { $in: ["INSIDE", "active"] },
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

  // Cross-zone barcode scan validation
  if (explicitZone === "Outdoor" && extractedZone === "Indoor") {
    res.status(400);
    throw new Error("⚠ This is an Indoor barcode. Not allowed at Outdoor entry.");
  }
  if (explicitZone === "Indoor" && extractedZone === "Outdoor") {
    res.status(400);
    throw new Error("⚠ This is an Outdoor barcode. Not allowed at Indoor entry.");
  }

  const wristTag = await WristTag.findOne({ tagId })
    .populate("customer", "name mobile")
    .populate("package", "name durationMinutes")
    .populate("bill", "billNumber");

  if (!wristTag) {
    res.status(404);
    throw new Error("✕ UNKNOWN WRIST TAG");
  }

  const now = new Date();
  wristTag.area = area;

  if (area === "Indoor") {
    if (isZoneActive(wristTag, "Indoor")) {
      res.status(400);
      throw new Error(`⚠ ALREADY INSIDE (Indoor)`);
    }
    if (isZoneDone(wristTag, "Indoor")) {
      res.status(400);
      throw new Error(`⚠ ALREADY EXITED (Indoor)`);
    }
    wristTag.indoorStatus = "INSIDE";
    wristTag.indoorEntryTime = now;
  } else {
    // Outdoor logic: Allow up to 5 scans for specific games
    const { gameName } = req.body;
    if (!gameName) {
      res.status(400);
      throw new Error("⚠ Please select an outdoor game to scan.");
    }
    
    if (wristTag.outdoorGamesPlayed && wristTag.outdoorGamesPlayed.length >= 5) {
      res.status(400);
      throw new Error(`⚠ MAXIMUM OUTDOOR GAMES (5) ALREADY PLAYED`);
    }

    if (wristTag.outdoorGamesPlayed && wristTag.outdoorGamesPlayed.some(g => g.gameName === gameName)) {
      res.status(400);
      throw new Error(`⚠ ${gameName.toUpperCase()} HAS ALREADY BEEN PLAYED`);
    }

    // Record the game
    if (!wristTag.outdoorGamesPlayed) wristTag.outdoorGamesPlayed = [];
    wristTag.outdoorGamesPlayed.push({ gameName, timestamp: now });
    
    // Set status
    wristTag.outdoorStatus = "INSIDE";
    if (!wristTag.outdoorEntryTime) wristTag.outdoorEntryTime = now;
  }

  // Overall tag stays INSIDE until both zones have been fully used
  if (!wristTag.entryTime) wristTag.entryTime = now;
  wristTag.status = "INSIDE";

  if (wristTag.package && wristTag.package.durationMinutes) {
    wristTag.expiryTime = new Date(now.getTime() + wristTag.package.durationMinutes * 60000);
  }

  await wristTag.save();

  // Find all members under this bill
  const billId = wristTag.bill?._id || wristTag.bill;
  const billTags = await WristTag.find({ bill: billId }).sort({ memberNumber: 1, createdAt: 1 });
  const totalMembers = billTags.length || 1;
  const insideCount = countInside(billTags);

  const membersList = buildMembersList(billTags);

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
    gameName: area === "Outdoor" ? req.body.gameName : null,
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
      gameName: area === "Outdoor" ? req.body.gameName : null,
      insideCount,
      totalMembers,
      membersList,
      parkStats,
    },
  });
});

// @desc  Mark a wrist tag as exited (zone-specific: indoor or outdoor)
// @route POST /api/entry/exit
const markExit = asyncHandler(async (req, res) => {
  const { tagId: rawId, zone: explicitZone } = req.body;
  const { tagId, zone: extractedZone } = extractTagInfo(rawId);

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

  // Determine which zone is being exited (requested zone → last-entered zone)
  const requestedArea = explicitZone || extractedZone;
  const area = requestedArea
    ? String(requestedArea).toLowerCase() === "outdoor" ? "Outdoor" : "Indoor"
    : wristTag.area === "Outdoor" ? "Outdoor" : "Indoor";

  // 1. Error handling: Exit a zone that was never entered
  if (!zoneEntryTime(wristTag, area) || !isZoneEntered(wristTag, area)) {
    res.status(400);
    throw new Error(`⚠ INVALID EXIT (${area} not entered)`);
  }

  // 2. Error handling: Zone already exited
  if (isZoneDone(wristTag, area)) {
    res.status(400);
    throw new Error(`⚠ ALREADY EXITED (${area})`);
  }

  const now = new Date();
  if (area === "Indoor") {
    wristTag.indoorStatus = "EXITED";
    wristTag.indoorExitTime = now;
    // Person is still in the park if the other zone is active
    if (isZoneActive(wristTag, "Outdoor")) wristTag.area = "Outdoor";
  } else {
    wristTag.outdoorStatus = "EXITED";
    wristTag.outdoorExitTime = now;
    if (isZoneActive(wristTag, "Indoor")) wristTag.area = "Indoor";
  }

  // Overall tag = EXITED only when both zones are finished
  if (bothZonesDone(wristTag)) {
    wristTag.status = "EXITED";
    wristTag.exitTime = now;
  } else {
    wristTag.status = "INSIDE";
  }
  await wristTag.save();

  // Find all members under this bill
  const billId = wristTag.bill?._id || wristTag.bill;
  const billTags = await WristTag.find({ bill: billId }).sort({ memberNumber: 1, createdAt: 1 });
  const totalMembers = billTags.length || 1;
  const insideCount = countInside(billTags);

  const membersList = buildMembersList(billTags);

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
