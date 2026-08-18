const asyncHandler = require("../utils/asyncHandler");
const mongoose = require("mongoose");
const Customer = require("../models/Customer");
const Package = require("../models/Package");
const Bill = require("../models/Bill");
const WristTag = require("../models/WristTag");
const CouponCode = require("../models/CouponCode");
const Coupon = require("../models/Coupon");
const { generateBillNumber, generateTagId } = require("../utils/generateId");
const { generateQRDataUrl } = require("../utils/generateQR");

// @desc  Create a full billing transaction: find/create customer, apply coupon,
//        generate bill, generate one wrist tag + QR PER PERSON, update customer stats.
// @route POST /api/billing
const createBill = asyncHandler(async (req, res) => {
  const {
    customerId,       // optional - if returning customer already looked up
    name, mobile, whatsapp, address, notes, // used if creating a new customer (or refreshing an existing profile)
    packageId,
    adults = 1,
    children = 0,
    below5 = 0,
    paymentMode = "cash",
    couponCode,
  } = req.body;

  if (!packageId) {
    res.status(400);
    throw new Error("A package must be selected");
  }

  const pkg = await Package.findById(packageId);
  if (!pkg || !pkg.active) {
    res.status(404);
    throw new Error("Selected package is not available");
  }

  // 1. Resolve customer (existing by id/mobile, or create new)
  let customer;
  if (customerId) {
    customer = await Customer.findById(customerId);
  }
  if (!customer && mobile) {
    customer = await Customer.findOne({ mobile });
  }
  if (!customer) {
    if (!name || !mobile) {
      res.status(400);
      throw new Error("Customer name and mobile number are required for new customers");
    }
    customer = await Customer.create({ name, mobile, whatsapp, address, notes });
  } else {
    // Keep the profile fresh from details captured at the counter
    if (name !== undefined) customer.name = name;
    if (whatsapp !== undefined) customer.whatsapp = whatsapp;
    if (address !== undefined) customer.address = address;
    if (notes !== undefined) customer.notes = notes;
  }

  const adultCount = Number(adults) || 0;
  const childCount = Number(children) || 0;
  const below5Count = Number(below5) || 0;
  const totalPersons = adultCount + childCount + below5Count;

  // 2. Bill amount = per-person pricing.
  //    Adults and children each pay the full package price.
  //    Below-5 children pay a separate (usually lower) rate per package.
  const adultChildAmount = (adultCount + childCount) * pkg.price;
  const below5Amount = below5Count * (pkg.below5Price || 0);
  const baseAmount = adultChildAmount + below5Amount;

  // 3. Apply coupon if provided
  let discount = 0;
  let appliedCouponCode = null;
  if (couponCode) {
    const normalizedCode = String(couponCode).trim().toUpperCase();
    appliedCouponCode = await CouponCode.findOne({ code: normalizedCode }).populate("coupon");
    if (!appliedCouponCode) {
      res.status(400);
      throw new Error("Coupon code not found");
    }
    if (appliedCouponCode.used) {
      res.status(400);
      throw new Error("This coupon has already been used. Coupons are valid for one customer only.");
    }
    const campaign = appliedCouponCode.coupon;
    const now = new Date();
    if (!campaign.active || now < campaign.validFrom || now > campaign.validTo) {
      res.status(400);
      throw new Error("This coupon is not currently valid");
    }
    if (baseAmount < campaign.minBillAmount) {
      res.status(400);
      throw new Error(`Minimum bill amount for this coupon is ${campaign.minBillAmount}`);
    }
    discount =
      campaign.discountType === "flat"
        ? campaign.discountValue
        : (baseAmount * campaign.discountValue) / 100;
  }

  const finalAmount = Math.max(baseAmount - discount, 0);

  // 4. Create the bill
  const bill = await Bill.create({
    billNumber: generateBillNumber(),
    customer: customer._id,
    package: pkg._id,
    adults: adultCount,
    children: childCount,
    below5: below5Count,
    baseAmount,
    discount,
    couponCode: appliedCouponCode ? appliedCouponCode._id : undefined,
    finalAmount,
    paymentMode,
    notes,
    createdBy: req.user ? req.user._id : undefined,
  });

  // 5. Mark coupon as used
  if (appliedCouponCode) {
    appliedCouponCode.used = true;
    appliedCouponCode.usedBill = bill._id;
    appliedCouponCode.usedAt = new Date();
    await appliedCouponCode.save();
  }

  // 6. Generate ONE wrist tag + QR per person. The QR is a URL to a mobile-friendly
  //    verification page: scanning with a phone opens the page with all the customer's
  //    details, and a scanner machine / webcam shows the details embedded in the URL text.
  //    The tagId is always in the path so gate scanning still works.
  const baseUrl = (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/+$/, "");
  const personLabels = [
    ...Array(adultCount).fill("adult"),
    ...Array(childCount).fill("child"),
    ...Array(below5Count).fill("below5"),
  ];

  const wristTags = [];
  for (let i = 0; i < totalPersons; i++) {
    const personType = personLabels[i] || "adult";
    const tagId = generateTagId();
    const label =
      personType === "below5" ? "Below 5" : personType === "child" ? "Child" : "Adult";
    
    // Separate QR payloads for Indoor and Outdoor zone single-use scanning with unique values
    const indoorQrPayload = `${baseUrl}/scan-tag/${tagId}-IND?zone=indoor&${new URLSearchParams({
      name: customer.name,
      mobile: customer.mobile,
      pkg: pkg.name,
      person: label,
      bill: bill.billNumber,
    }).toString()}`;

    const outdoorQrPayload = `${baseUrl}/scan-tag/${tagId}-OUT?zone=outdoor&${new URLSearchParams({
      name: customer.name,
      mobile: customer.mobile,
      pkg: pkg.name,
      person: label,
      bill: bill.billNumber,
    }).toString()}`;

    const indoorQrCodeDataUrl = await generateQRDataUrl(indoorQrPayload);
    const outdoorQrCodeDataUrl = await generateQRDataUrl(outdoorQrPayload);
    const qrCodeDataUrl = indoorQrCodeDataUrl; // primary fallback
    const expiryTime = new Date(Date.now() + pkg.durationMinutes * 60000);

    const wristTag = await WristTag.create({
      tagId,
      qrCodeDataUrl,
      indoorQrCodeDataUrl,
      outdoorQrCodeDataUrl,
      bill: bill._id,
      customer: customer._id,
      package: pkg._id,
      personType,
      adults: personType === "adult" ? 1 : 0,
      children: personType === "child" ? 1 : 0,
      below5: personType === "below5" ? 1 : 0,
      status: "unused",
      indoorStatus: "unused",
      outdoorStatus: "unused",
      expiryTime,
    });
    wristTags.push(wristTag);
  }

  // 7. Update customer visit/spending stats
  customer.totalVisits += 1;
  customer.totalSpending += finalAmount;
  customer.lastVisitDate = new Date();
  customer.customerType = customer.totalVisits >= 5 ? "vip" : customer.totalVisits > 1 ? "regular" : "new";
  await customer.save();

  res.status(201).json({
    success: true,
    data: {
      bill,
      wristTags,
      customer,
    },
  });
});

// @desc  Preview a coupon's offer on the current selection (used to confirm the bill)
// @route POST /api/billing/verify-coupon
const verifyCoupon = asyncHandler(async (req, res) => {
  const { packageId, below5 = 0, adults = 1, children = 0, couponCode } = req.body;
  if (!packageId || !couponCode) {
    res.status(400);
    throw new Error("packageId and couponCode are required");
  }
  const pkg = await Package.findById(packageId);
  if (!pkg) {
    res.status(404);
    throw new Error("Package not found");
  }

  const below5Count = Number(below5) || 0;
  const adultCount = Number(adults) || 1;
  const childCount = Number(children) || 0;
  const adultChildAmount = (adultCount + childCount) * pkg.price;
  const below5Amount = below5Count * (pkg.below5Price || 0);
  const baseAmount = adultChildAmount + below5Amount;

  const normalizedCode = String(couponCode).trim().toUpperCase();
  const couponCodeDoc = await CouponCode.findOne({ code: normalizedCode }).populate("coupon");
  if (!couponCodeDoc) {
    res.status(404);
    throw new Error("Coupon code not found");
  }
  if (couponCodeDoc.used) {
    res.status(400);
    throw new Error("This coupon has already been used. Coupons are valid for one customer only.");
  }
  const campaign = couponCodeDoc.coupon;
  const now = new Date();
  if (!campaign.active || now < campaign.validFrom || now > campaign.validTo) {
    res.status(400);
    throw new Error("This coupon is not currently valid");
  }
  if (baseAmount < campaign.minBillAmount) {
    res.status(400);
    throw new Error(`Minimum bill amount for this coupon is ${campaign.minBillAmount}`);
  }

  const discount =
    campaign.discountType === "flat"
      ? campaign.discountValue
      : (baseAmount * campaign.discountValue) / 100;
  const finalAmount = Math.max(baseAmount - discount, 0);

  res.json({
    success: true,
    data: {
      package: { name: pkg.name, price: pkg.price, below5Price: pkg.below5Price || 0 },
      coupon: {
        code: normalizedCode,
        partnerName: campaign.partnerName,
        campaignName: campaign.campaignName,
        discountType: campaign.discountType,
        discountValue: campaign.discountValue,
        minBillAmount: campaign.minBillAmount,
      },
      below5Count,
      below5Amount,
      baseAmount,
      discount: Math.round(discount),
      finalAmount: Math.round(finalAmount),
    },
  });
});

// @desc  Get a bill by id (with populated refs) - used for printing/invoice view
// @route GET /api/billing/:id
const getBill = asyncHandler(async (req, res) => {
  const bill = await Bill.findById(req.params.id)
    .populate("customer")
    .populate("package")
    .populate("createdBy", "name role");
  if (!bill) {
    res.status(404);
    throw new Error("Bill not found");
  }
  const wristTags = await WristTag.find({ bill: bill._id });
  res.json({ success: true, data: { bill, wristTags } });
});

// @desc  List bills (recent first), filterable by date range
// @route GET /api/billing?from=&to=&page=&limit=
const getBills = asyncHandler(async (req, res) => {
  const { from, to, page = 1, limit = 20 } = req.query;
  const query = {};
  if (from || to) {
    query.createdAt = {};
    if (from) query.createdAt.$gte = new Date(from);
    if (to) query.createdAt.$lte = new Date(to);
  }
  const bills = await Bill.find(query)
    .populate("customer", "name mobile")
    .populate("package", "name price")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));
  const total = await Bill.countDocuments(query);
  res.json({ success: true, data: bills, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @desc  Full visit + spending history for one customer
// @route GET /api/billing/customer/:customerId
const getCustomerHistory = asyncHandler(async (req, res) => {
  const bills = await Bill.find({ customer: req.params.customerId })
    .populate("package", "name price")
    .sort({ createdAt: -1 });
  res.json({ success: true, data: bills });
});

module.exports = { createBill, verifyCoupon, getBill, getBills, getCustomerHistory };
