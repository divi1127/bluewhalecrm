require("dotenv").config();
const connectDB = require("../config/db");
const User = require("../models/User");
const Staff = require("../models/Staff");
const Customer = require("../models/Customer");
const Package = require("../models/Package");
const Bill = require("../models/Bill");
const WristTag = require("../models/WristTag");
const Coupon = require("../models/Coupon");
const CouponCode = require("../models/CouponCode");
const Booking = require("../models/Booking");
const Attendance = require("../models/Attendance");

const staffSeed = [
  { staffId: "STF0001", name: "Ravi Kumar", phone: "9444012345", designation: "Ticket Counter / Billing", dob: "1990-04-12", joiningDate: "2022-01-15", salaryType: "monthly", salaryAmount: 18000, role: "billing_staff" },
  { staffId: "STF0002", name: "Meena Selvam", phone: "9444023456", designation: "Entry Gate Staff", dob: "1994-08-23", joiningDate: "2022-03-01", salaryType: "monthly", salaryAmount: 15000, role: "entry_staff" },
  { staffId: "STF0003", name: "Arun Prakash", phone: "9444034567", designation: "Park Supervisor", dob: "1988-11-05", joiningDate: "2021-06-20", salaryType: "monthly", salaryAmount: 22000, role: "admin" },
  { staffId: "STF0004", name: "Lakshmi Priya", phone: "9444045678", designation: "HR Manager", dob: "1992-02-17", joiningDate: "2022-08-10", salaryType: "monthly", salaryAmount: 25000, role: "hr_manager" },
  { staffId: "STF0005", name: "Karthik Rajan", phone: "9444056789", designation: "Security", dob: "1995-06-30", joiningDate: "2023-01-05", salaryType: "daily", salaryAmount: 700, role: "entry_staff" },
  { staffId: "STF0006", name: "Divya Bharathi", phone: "9444067890", designation: "Cleaner / Maintenance", dob: "1997-09-14", joiningDate: "2023-04-18", salaryType: "daily", salaryAmount: 600, role: "entry_staff" },
  { staffId: "STF0007", name: "Santhosh Varma", phone: "9444078901", designation: "Cashier", dob: "1993-12-01", joiningDate: "2022-11-01", salaryType: "monthly", salaryAmount: 16000, role: "cashier" },
];

const dobPassword = (dob) => {
  const [y, m, d] = dob.split("-");
  return `${d}${m}${y}`;
};

const resetDatabase = async () => {
  console.log("Connecting to database...");
  await connectDB();

  console.log("Deleting demo data across all modules...");
  await Promise.all([
    Bill.deleteMany({}),
    WristTag.deleteMany({}),
    Customer.deleteMany({}),
    Coupon.deleteMany({}),
    CouponCode.deleteMany({}),
    Booking.deleteMany({}),
    Attendance.deleteMany({}),
    Package.deleteMany({}),
  ]);
  console.log("✓ Cleared: Bills, WristTags, Customers, CRM follow-ups, Coupons, Bookings, Attendance, and old Packages.");

  // Create only the requested default package
  console.log("Creating default package: General Entry (₹600) / Kids Below 5 Years (₹350)...");
  const defaultPackage = await Package.create({
    name: "General Entry",
    price: 600,
    below5Price: 350,
    durationValue: 1,
    durationUnit: "hours",
    durationMinutes: 60,
    description: "General Entry - ₹600 per person, Kids Below 5 Years ₹350 per child",
    active: true,
  });
  console.log(`✓ Package created: ${defaultPackage.name} (Adult/Child: ₹${defaultPackage.price}, Below-5: ₹${defaultPackage.below5Price})`);

  // Verify or seed staff & admin accounts if not already present
  const userCount = await User.countDocuments();
  if (userCount === 0) {
    console.log("Setting up default staff and administrative users...");
    const staffDocs = staffSeed.map(({ role, ...rest }) => rest);
    const staffList = await Staff.insertMany(staffDocs);

    const users = [
      { name: "Super Admin", email: "superadmin@bluewhale.com", password: "superadmin@123", role: "super_admin", phone: "9000000001" },
      { name: "Operations Manager", email: "manager@bluewhale.local", password: "Admin@123", role: "admin", phone: "9000000002" },
    ];

    for (const s of staffList) {
      const meta = staffSeed.find((x) => x.staffId === s.staffId);
      users.push({
        name: s.name,
        username: s.staffId.toLowerCase(),
        email: `${s.staffId.toLowerCase()}@bluewhale.local`,
        password: dobPassword(meta.dob),
        phone: s.phone,
        role: meta.role,
        staff: s._id,
      });
    }

    for (const u of users) {
      await User.create(u);
    }
    console.log(`✓ Users created (${users.length})`);
  } else {
    console.log(`✓ Preserved existing ${userCount} administrative & staff users.`);
  }

  console.log("\n==================================================");
  console.log("DATABASE RESET COMPLETE!");
  console.log("All dashboard metrics, bills, customers, tags, and coupons are now clean.");
  console.log("Ready for fresh original data entry.");
  console.log("Logins available:");
  console.log("  superadmin@bluewhale.com / superadmin@123 (Super Admin)");
  console.log("  manager@bluewhale.local / Admin@123 (Admin)");
  console.log("==================================================");
  process.exit(0);
};

resetDatabase().catch((err) => {
  console.error("Reset failed:", err);
  process.exit(1);
});
