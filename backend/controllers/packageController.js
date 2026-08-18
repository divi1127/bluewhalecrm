const asyncHandler = require("../utils/asyncHandler");
const Package = require("../models/Package");

const normalizeDuration = (body) => {
  const value = Number(body.durationValue);
  const unit = body.durationUnit === "hours" ? "hours" : "minutes";
  return {
    durationValue: value,
    durationUnit: unit,
    durationMinutes: unit === "hours" ? value * 60 : value,
  };
};

const getPackages = asyncHandler(async (req, res) => {
  const filter = req.query.active === "true" ? { active: true } : {};
  let packages = await Package.find(filter).sort({ price: 1 });
  packages = packages.map((p) => {
    if (p.durationValue == null) {
      const unit = p.durationUnit === "hours" ? "hours" : "minutes";
      const minutes = p.durationMinutes || 0;
      p.durationValue = unit === "hours" ? minutes / 60 : minutes;
    }
    return p;
  });
  res.json({ success: true, data: packages });
});

const createPackage = asyncHandler(async (req, res) => {
  const pkg = await Package.create({ ...req.body, ...normalizeDuration(req.body) });
  res.status(201).json({ success: true, data: pkg });
});

const updatePackage = asyncHandler(async (req, res) => {
  const body = { ...req.body };
  if (req.body.durationValue !== undefined || req.body.durationUnit !== undefined) {
    Object.assign(body, normalizeDuration(req.body));
  }
  const pkg = await Package.findByIdAndUpdate(req.params.id, body, {
    new: true,
    runValidators: true,
  });
  if (!pkg) {
    res.status(404);
    throw new Error("Package not found");
  }
  res.json({ success: true, data: pkg });
});

const deletePackage = asyncHandler(async (req, res) => {
  const pkg = await Package.findByIdAndUpdate(req.params.id, { active: false }, { new: true });
  if (!pkg) {
    res.status(404);
    throw new Error("Package not found");
  }
  res.json({ success: true, data: pkg });
});

module.exports = { getPackages, createPackage, updatePackage, deletePackage };
