const asyncHandler = require("../utils/asyncHandler");
const WristTag = require("../models/WristTag");
const Package = require("../models/Package");

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

// @desc  Entry staff scans a wrist-tag QR (Indoor or Outdoor). Validates single-use entry.
// @route POST /api/entry/scan
const scanEntry = asyncHandler(async (req, res) => {
  const { tagId: rawId, zone: explicitZone } = req.body;
  const { tagId, zone: extractedZone } = extractTagInfo(rawId);
  const zone = explicitZone || extractedZone || "general";

  if (!tagId) {
    res.status(400);
    throw new Error("tagId is required");
  }

  const wristTag = await WristTag.findOne({ tagId })
    .populate("customer", "name mobile")
    .populate("package", "name durationMinutes");

  if (!wristTag) {
    res.status(404);
    throw new Error("Invalid QR code - ticket not found");
  }

  // Zone specific single-use check
  if (zone === "indoor") {
    if (wristTag.indoorStatus === "exited") {
      res.status(400);
      throw new Error("Indoor entry QR for this ticket has ALREADY BEEN USED and exited");
    }
    if (wristTag.indoorStatus === "active") {
      res.status(400);
      throw new Error("Indoor entry is currently active for this ticket");
    }
    wristTag.indoorStatus = "active";
    wristTag.indoorEntryTime = new Date();
  } else if (zone === "outdoor") {
    if (wristTag.outdoorStatus === "exited") {
      res.status(400);
      throw new Error("Outdoor entry QR for this ticket has ALREADY BEEN USED and exited");
    }
    if (wristTag.outdoorStatus === "active") {
      res.status(400);
      throw new Error("Outdoor entry is currently active for this ticket");
    }
    wristTag.outdoorStatus = "active";
    wristTag.outdoorEntryTime = new Date();
  } else {
    if (wristTag.status === "exited") {
      res.status(400);
      throw new Error("This ticket has already been used and the customer has exited");
    }
    if (wristTag.status === "active") {
      res.status(400);
      throw new Error("This ticket is already active inside the park");
    }
  }

  // Set overall entry timer if not set yet
  if (wristTag.status === "unused") {
    wristTag.status = "active";
    wristTag.entryTime = new Date();
    wristTag.expiryTime = new Date(wristTag.entryTime.getTime() + wristTag.package.durationMinutes * 60000);
  }

  await wristTag.save();

  const zoneLabel = zone === "indoor" ? "Indoor Zone" : zone === "outdoor" ? "Outdoor Zone" : "Park";
  res.json({
    success: true,
    data: wristTag,
    message: `${zoneLabel} entry allowed for ${wristTag.customer.name}`,
  });
});

// @desc  Mark a wrist tag (or specific zone) as exited (one-time use finished)
// @route POST /api/entry/exit
const markExit = asyncHandler(async (req, res) => {
  const { tagId: rawId, zone: explicitZone } = req.body;
  const { tagId, zone: extractedZone } = extractTagInfo(rawId);
  const zone = explicitZone || extractedZone || "general";

  if (!tagId) {
    res.status(400);
    throw new Error("tagId is required");
  }

  const wristTag = await WristTag.findOne({ tagId })
    .populate("customer", "name mobile")
    .populate("package", "name durationMinutes");

  if (!wristTag) {
    res.status(404);
    throw new Error("Invalid QR code - ticket not found");
  }

  const now = new Date();
  if (zone === "indoor") {
    if (wristTag.indoorStatus === "exited") {
      res.status(400);
      throw new Error("Indoor section already marked as exited/used");
    }
    wristTag.indoorStatus = "exited";
    wristTag.indoorExitTime = now;
  } else if (zone === "outdoor") {
    if (wristTag.outdoorStatus === "exited") {
      res.status(400);
      throw new Error("Outdoor section already marked as exited/used");
    }
    wristTag.outdoorStatus = "exited";
    wristTag.outdoorExitTime = now;
  } else {
    wristTag.status = "exited";
    wristTag.indoorStatus = "exited";
    wristTag.outdoorStatus = "exited";
    wristTag.exitTime = now;
  }

  // If both sections are exited, mark overall status as exited
  if (wristTag.indoorStatus === "exited" && wristTag.outdoorStatus === "exited") {
    wristTag.status = "exited";
    wristTag.exitTime = now;
  }

  await wristTag.save();
  const zoneText = zone === "indoor" ? "Indoor" : zone === "outdoor" ? "Outdoor" : "Overall";
  res.json({
    success: true,
    data: wristTag,
    message: `${zoneText} exit recorded for ${wristTag.customer.name}`,
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

  const active = await WristTag.find({ status: "active" })
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

module.exports = { scanEntry, markExit, getActiveEntries, getTagStatus };
