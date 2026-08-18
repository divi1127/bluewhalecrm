const asyncHandler = require("../utils/asyncHandler");
const Coupon = require("../models/Coupon");
const CouponCode = require("../models/CouponCode");
const { generateCouponCode } = require("../utils/generateId");
const { generateQRDataUrl } = require("../utils/generateQR");

// @desc  Create a new partner coupon campaign
// @route POST /api/coupons
const createCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.create(req.body);
  res.status(201).json({ success: true, data: coupon });
});

// @desc  List all coupon campaigns
// @route GET /api/coupons
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.json({ success: true, data: coupons });
});

// @desc  Update a coupon campaign
// @route PUT /api/coupons/:id
const updateCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon campaign not found");
  }
  res.json({ success: true, data: coupon });
});

// @desc  Generate N unique codes (with QR) under a campaign, to hand to the partner shop
// @route POST /api/coupons/:id/generate-codes
const generateCodes = asyncHandler(async (req, res) => {
  const { count = 1 } = req.body;
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon campaign not found");
  }

  const prefix = coupon.partnerName.slice(0, 3).toUpperCase();
  const codes = [];
  for (let i = 0; i < Number(count); i++) {
    const code = generateCouponCode(prefix);
    const qrCodeDataUrl = await generateQRDataUrl(code);
    codes.push({ coupon: coupon._id, code, qrCodeDataUrl });
  }
  // qrCodeDataUrl isn't part of the schema (generated on the fly) - store codes then attach QR in response
  const created = await CouponCode.insertMany(codes.map(({ coupon, code }) => ({ coupon, code })));

  coupon.totalCodesIssued += created.length;
  await coupon.save();

  const withQr = created.map((c, i) => ({ ...c.toObject(), qrCodeDataUrl: codes[i].qrCodeDataUrl }));
  res.status(201).json({ success: true, data: withQr });
});

// @desc  Verify a coupon code (used at billing, before applying)
// @route GET /api/coupons/verify/:code
const verifyCode = asyncHandler(async (req, res) => {
  const couponCode = await CouponCode.findOne({
    code: String(req.params.code).trim().toUpperCase(),
  }).populate("coupon");
  if (!couponCode) {
    res.status(404);
    throw new Error("Coupon code not found");
  }
  if (couponCode.used) {
    res.status(400);
    throw new Error("This coupon has already been used. Coupons are valid for one customer only.");
  }
  const now = new Date();
  const campaign = couponCode.coupon;
  if (!campaign.active || now < campaign.validFrom || now > campaign.validTo) {
    res.status(400);
    throw new Error("This coupon is not currently valid");
  }
  res.json({ success: true, data: couponCode });
});

// @desc  Partner-wise performance: codes issued, used, and revenue generated
// @route GET /api/coupons/:id/performance
const getCouponPerformance = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    res.status(404);
    throw new Error("Coupon campaign not found");
  }
  const codes = await CouponCode.find({ coupon: coupon._id }).populate({
    path: "usedBill",
    select: "finalAmount createdAt",
  });
  const issued = codes.length;
  const used = codes.filter((c) => c.used).length;
  const revenue = codes.reduce((sum, c) => sum + (c.usedBill ? c.usedBill.finalAmount : 0), 0);

  res.json({ success: true, data: { coupon, issued, used, unused: issued - used, revenue } });
});

module.exports = { createCoupon, getCoupons, updateCoupon, generateCodes, verifyCode, getCouponPerformance };
