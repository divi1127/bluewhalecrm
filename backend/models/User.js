const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    username: { type: String, unique: true, sparse: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6, select: false },
    phone: { type: String, trim: true },
    dob: { type: String, trim: true },
    role: {
      type: String,
      enum: ["super_admin", "admin", "billing_staff", "cashier", "entry_staff", "hr_manager"],
      default: "billing_staff",
    },
    // Fine-grained module access: { module: { view, create, edit, delete } }.
    // Empty ({} or []) = full access allowed by the role.
    // super_admin always has full access regardless of this field.
    permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
    staff: { type: mongoose.Schema.Types.ObjectId, ref: "Staff" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

// Converts a DOB into the default login password (DDMMYYYY), e.g. "1995-06-30" -> "30061995"
userSchema.statics.dobPassword = function (dob) {
  const cleaned = String(dob || "").trim();
  if (!cleaned) return "";
  const parts = cleaned.split("-");
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}${m}${y}`;
  }
  const digits = cleaned.replace(/\D/g, "");
  return digits.length >= 8 ? digits.slice(0, 8) : digits;
};

module.exports = mongoose.model("User", userSchema);
