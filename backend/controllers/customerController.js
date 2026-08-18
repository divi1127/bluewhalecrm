const asyncHandler = require("../utils/asyncHandler");
const Customer = require("../models/Customer");

// @desc  List/search customers (by name or mobile), paginated
// @route GET /api/customers?search=&page=&limit=
const getCustomers = asyncHandler(async (req, res) => {
  const { search = "", page = 1, limit = 20, type } = req.query;
  const query = {};
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { mobile: { $regex: search, $options: "i" } },
    ];
  }
  if (type) query.customerType = type;

  const customers = await Customer.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Customer.countDocuments(query);

  res.json({ success: true, data: customers, total, page: Number(page), pages: Math.ceil(total / limit) });
});

// @desc  Find a single customer by mobile number (used for returning-customer lookup during billing)
// @route GET /api/customers/lookup/:mobile
const lookupByMobile = asyncHandler(async (req, res) => {
  const customer = await Customer.findOne({ mobile: req.params.mobile });
  res.json({ success: true, data: customer || null });
});

// @desc  Get a single customer with visit/spending summary
// @route GET /api/customers/:id
const getCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  res.json({ success: true, data: customer });
});

// @desc  Create a customer directly (usually customers are created via billing, but allow manual add)
// @route POST /api/customers
const createCustomer = asyncHandler(async (req, res) => {
  const { name, mobile, whatsapp, address } = req.body;
  const existing = await Customer.findOne({ mobile });
  if (existing) {
    res.status(400);
    throw new Error("A customer with this mobile number already exists");
  }
  const customer = await Customer.create({ name, mobile, whatsapp, address });
  res.status(201).json({ success: true, data: customer });
});

// @desc  Update a customer's profile
// @route PUT /api/customers/:id
const updateCustomer = asyncHandler(async (req, res) => {
  const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  res.json({ success: true, data: customer });
});

// @desc  Follow-up list: customers matching inactivity / type criteria, with stats
// @route GET /api/customers/followup/list?days=30&type=inactive&status=pending
const getFollowUpList = asyncHandler(async (req, res) => {
  const { days = 30, type, status } = req.query;
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - Number(days));

  const query = { lastVisitDate: { $lte: cutoff } };
  if (type) query.customerType = type;
  if (status) query.followUpStatus = status;

  const customers = await Customer.find(query)
    .sort({ lastVisitDate: 1 })
    .select("name mobile whatsapp address totalVisits totalSpending lastVisitDate customerType notes followUpDate followUpNote nextFollowUpDate followUpStatus");

  // Stats across the whole inactivity bucket (not just the filtered slice)
  const statsQuery = { lastVisitDate: { $lte: cutoff } };
  const total = await Customer.countDocuments(statsQuery);
  const byType = {};
  const typeNames = ["new", "regular", "vip", "inactive"];
  for (const t of typeNames) {
    byType[t] = await Customer.countDocuments({ ...statsQuery, customerType: t });
  }
  const pending = await Customer.countDocuments({ ...statsQuery, followUpStatus: { $ne: "contacted" } });
  const potential = await Customer.aggregate([
    { $match: statsQuery },
    { $group: { _id: null, total: { $sum: "$totalSpending" } } },
  ]);

  res.json({
    success: true,
    data: customers,
    stats: {
      total,
      byType,
      pending,
      potentialRevenue: potential[0]?.total || 0,
      cutoff,
    },
  });
});

// @desc  Mark a customer as followed up (add note + status, optionally schedule next follow-up)
// @route POST /api/customers/:id/followup
const markFollowUp = asyncHandler(async (req, res) => {
  const { note, status = "contacted", nextFollowUpDate } = req.body;
  const customer = await Customer.findById(req.params.id);
  if (!customer) {
    res.status(404);
    throw new Error("Customer not found");
  }
  if (note !== undefined) customer.followUpNote = note;
  if (status) customer.followUpStatus = status;
  if (nextFollowUpDate) customer.nextFollowUpDate = nextFollowUpDate;
  customer.followUpDate = new Date();
  await customer.save();
  res.json({ success: true, data: customer });
});

module.exports = {
  getCustomers,
  lookupByMobile,
  getCustomer,
  createCustomer,
  updateCustomer,
  getFollowUpList,
  markFollowUp,
};
