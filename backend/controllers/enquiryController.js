const asyncHandler = require("../utils/asyncHandler");
const Enquiry = require("../models/Enquiry");
const Customer = require("../models/Customer");

// @desc  Public enquiry from the landing page (no auth). Also upserts a CRM customer.
// @route POST /api/enquiries/public
const createPublicEnquiry = asyncHandler(async (req, res) => {
  const { name, mobile, email, message } = req.body;
  if (!name || !mobile) {
    res.status(400);
    throw new Error("Name and mobile number are required");
  }

  let customer = await Customer.findOne({ mobile });
  if (customer) {
    if (name && !customer.name) customer.name = name;
    if (email) customer.whatsapp = customer.whatsapp || email;
    await customer.save();
  } else {
    customer = await Customer.create({
      name,
      mobile,
      whatsapp: email || undefined,
      notes: "Lead from website enquiry",
    });
  }

  const enquiry = await Enquiry.create({
    name,
    mobile,
    email,
    message,
    source: "landing",
    status: "new",
    customer: customer._id,
  });

  res.status(201).json({ success: true, data: enquiry });
});

// @desc  List/search enquiries, paginated
// @route GET /api/enquiries?search=&status=&page=&limit=
const getEnquiries = asyncHandler(async (req, res) => {
  const { search = "", status, page = 1, limit = 20 } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  if (status) query.status = status;

  const enquiries = await Enquiry.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Enquiry.countDocuments(query);

  res.json({ success: true, data: enquiries, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @desc  Get a single enquiry
// @route GET /api/enquiries/:id
const getEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id).populate("customer", "name mobile customerType totalSpending");
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }
  res.json({ success: true, data: enquiry });
});

// @desc  Update enquiry (status / notes)
// @route PUT /api/enquiries/:id
const updateEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }
  const { status, notes, message } = req.body;
  if (status !== undefined) enquiry.status = status;
  if (notes !== undefined) enquiry.notes = notes;
  if (message !== undefined) enquiry.message = message;
  await enquiry.save();
  res.json({ success: true, data: enquiry });
});

// @desc  Delete an enquiry
// @route DELETE /api/enquiries/:id
const deleteEnquiry = asyncHandler(async (req, res) => {
  const enquiry = await Enquiry.findById(req.params.id);
  if (!enquiry) {
    res.status(404);
    throw new Error("Enquiry not found");
  }
  await enquiry.deleteOne();
  res.json({ success: true, data: { _id: enquiry._id } });
});

module.exports = { createPublicEnquiry, getEnquiries, getEnquiry, updateEnquiry, deleteEnquiry };