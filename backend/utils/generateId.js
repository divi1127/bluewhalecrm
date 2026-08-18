const { customAlphabet } = require("nanoid");

const alphabet = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";
const nano = customAlphabet(alphabet, 8);

const generateBillNumber = () => `BW-${Date.now().toString().slice(-6)}-${nano().slice(0, 4)}`;
const generateTagId = () => `WT-${nano()}`;
const generateCouponCode = (prefix = "BW") => `${prefix}-${nano().slice(0, 6)}`;

module.exports = { generateBillNumber, generateTagId, generateCouponCode };
