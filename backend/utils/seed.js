// Run with: npm run seed
// Wipes and recreates a full demo dataset covering every module:
//   Users & Staff (auth + HR), Packages, Customers (CRM/follow-up),
//   Bills (billing), WristTags + QR (entry/TV), Coupons (partner),
//   Bookings (party), Attendance (HR/attendance/salary).
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
const { generateBillNumber, generateTagId, generateCouponCode } = require("./generateId");
const { generateQRDataUrl } = require("./generateQR");

const DAY = 86400000;
const MIN = 60000;
const pad = (n) => String(n).padStart(2, "0");
const dateKey = (d) => new Date(d).toISOString().slice(0, 10);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

let seedRng = 987654321;
const rnd = () => ((seedRng = (seedRng * 1103515245 + 12345) % 2147483648) / 2147483648);

const daysAgo = (n, hour = 10, min = 30) => {
  const d = new Date(Date.now() - n * DAY);
  d.setHours(hour, min, 0, 0);
  return d;
};

const log = (msg) => console.log(msg);

const wipe = async () => {
  await Promise.all([
    CouponCode.deleteMany({}),
    WristTag.deleteMany({}),
    Bill.deleteMany({}),
    Attendance.deleteMany({}),
    Booking.deleteMany({}),
    Customer.deleteMany({}),
    Coupon.deleteMany({}),
    Package.deleteMany({}),
    Staff.deleteMany({}),
    User.deleteMany({}),
  ]);
  log("Cleared all collections.");
};

const seedPackages = async () => {
  await Package.insertMany([
    { name: "Standard Entry", price: 299, below5Price: 100, durationValue: 2, durationUnit: "hours", durationMinutes: 120, description: "General park access, 2 hours" },
    { name: "Premium Entry", price: 499, below5Price: 150, durationValue: 3, durationUnit: "hours", durationMinutes: 180, description: "All rides + 3 hours access" },
    { name: "Full Day Pass", price: 799, below5Price: 250, durationValue: 8, durationUnit: "hours", durationMinutes: 480, description: "Full day access, all attractions" },
  ]);
  log(`Packages: 3 created.`);
  return Package.find();
};

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

const seedStaffAndUsers = async () => {
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

  const createdUsers = [];
  for (const u of users) createdUsers.push(await User.create(u));
  log(`Staff: ${staffList.length} created with auto logins.`);
  log(`Users: ${createdUsers.length} created (superadmin@bluewhale.com / superadmin@123).`);
  return { staffList, users: createdUsers };
};

const customerSeed = [
  { name: "Karthik Suresh", mobile: "9876500001", whatsapp: "9876500001", address: "12, Anna Nagar, Chennai", notes: "Prefers full day passes" },
  { name: "Priya Raman", mobile: "9876500002", whatsapp: "9876500002", address: "45, T Nagar, Chennai", notes: "Birthday party in May" },
  { name: "Arun Kumar", mobile: "9876500003", whatsapp: "9876500003", address: "8, Velachery, Chennai" },
  { name: "Meena Krishnan", mobile: "9876500004", whatsapp: "9876500004", address: "23, Adyar, Chennai" },
  { name: "Rajesh Babu", mobile: "9876500005", whatsapp: "9876500005", address: "101, Porur, Chennai" },
  { name: "Anitha Reddy", mobile: "9876500006", whatsapp: "9876500006", address: "34, Ambattur, Chennai" },
  { name: "Suresh Kumar", mobile: "9876500007", whatsapp: "9876500007", address: "67, Chromepet, Chennai" },
  { name: "Kavitha V", mobile: "9876500008", whatsapp: "9876500008", address: "89, Kilpauk, Chennai" },
  { name: "Vijay Subramanian", mobile: "9876500009", whatsapp: "9876500009", address: "14, Mylapore, Chennai" },
  { name: "Divya Nair", mobile: "9876500010", whatsapp: "9876500010", address: "52, Nungambakkam, Chennai" },
  { name: "Ganesh Moorthy", mobile: "9876500011", whatsapp: "9876500011", address: "31, Besant Nagar, Chennai" },
  { name: "Swathi Raj", mobile: "9876500012", whatsapp: "9876500012", address: "77, Guindy, Chennai" },
  { name: "Mohan Das", mobile: "9876500013", whatsapp: "9876500013", address: "5, Saidapet, Chennai", notes: "Corporate tie-up" },
  { name: "Selvi Balan", mobile: "9876500014", whatsapp: "9876500014", address: "96, K.K. Nagar, Chennai" },
  { name: "Praveen C", mobile: "9876500015", whatsapp: "9876500015", address: "18, Perungudi, Chennai" },
];

const seedCustomers = async () => {
  const customers = await Customer.insertMany(customerSeed);

  // Follow-up candidates: dormant customers + those overdue for contact, with CRM status
  await Customer.create([
    { name: "Ramesh Iyer", mobile: "9876500100", whatsapp: "9876500100", address: "2, Thiruvanmiyur, Chennai", totalVisits: 2, totalSpending: 1400, lastVisitDate: daysAgo(75), customerType: "inactive", notes: "Not visited in 2 months - follow up", followUpStatus: "pending" },
    { name: "Jayanthi K", mobile: "9876500101", whatsapp: "9876500101", address: "9, Anna Nagar West, Chennai", totalVisits: 1, totalSpending: 899, lastVisitDate: daysAgo(120), customerType: "inactive", notes: "Follow up with WhatsApp offer", followUpStatus: "pending" },
    { name: "Suresh Mani", mobile: "9876500102", whatsapp: "9876500102", address: "44, OMR, Chennai", totalVisits: 6, totalSpending: 5200, lastVisitDate: daysAgo(60), customerType: "vip", notes: "VIP - used to visit weekly", followUpStatus: "pending", followUpDate: daysAgo(30), followUpNote: "Called, no response" },
    { name: "Latha Ramesh", mobile: "9876500103", whatsapp: "9876500103", address: "12, Adyar, Chennai", totalVisits: 3, totalSpending: 2100, lastVisitDate: daysAgo(45), customerType: "regular", notes: "Loves weekend visits", followUpStatus: "contacted", followUpDate: daysAgo(10), followUpNote: "Sent WhatsApp offer", nextFollowUpDate: daysAgo(-20) },
  ]);
  log(`Customers: ${customers.length} created (+4 follow-up candidates).`);
  return customers;
};

const refreshCustomerStats = async (customers, bills) => {
  for (const c of customers) {
    const myBills = bills.filter((b) => String(b.customer) === String(c._id));
    if (myBills.length) {
      c.totalVisits = myBills.length;
      c.totalSpending = myBills.reduce((s, b) => s + b.finalAmount, 0);
      c.lastVisitDate = new Date(Math.max(...myBills.map((b) => new Date(b.createdAt).getTime())));
      c.customerType = c.totalVisits >= 5 ? "vip" : c.totalVisits > 1 ? "regular" : "new";
    }
    await c.save();
  }
};

const seedCoupons = async (bills) => {
  const coupons = await Coupon.insertMany([
    { partnerName: "Kumaran Textiles", campaignName: "Diwali Special", discountType: "flat", discountValue: 100, minBillAmount: 500, validFrom: new Date(Date.now() - 30 * DAY), validTo: new Date(Date.now() + 200 * DAY), totalCodesIssued: 0, active: true },
    { partnerName: "Star Hotel", campaignName: "Weekend Cashback", discountType: "percent", discountValue: 10, minBillAmount: 300, validFrom: new Date(Date.now() - 30 * DAY), validTo: new Date(Date.now() + 200 * DAY), totalCodesIssued: 0, active: true },
  ]);

  const allCodes = [];
  for (const coupon of coupons) {
    const prefix = coupon.partnerName.slice(0, 3).toUpperCase();
    const codes = [];
    for (let i = 0; i < 10; i++) codes.push(generateCouponCode(prefix));
    const docs = codes.map((code) => ({ coupon: coupon._id, code }));
    const created = await CouponCode.insertMany(docs);
    allCodes.push(...created);
    coupon.totalCodesIssued += created.length;
    await coupon.save();
  }

  // Redeem a few codes against real bills so coupon reports/dashboard show usage
  const redeemable = bills.filter((b) => b.finalAmount >= 300);
  for (let i = 0; i < 6 && i < allCodes.length && i < redeemable.length; i++) {
    const code = allCodes[i];
    const bill = redeemable[i];
    code.used = true;
    code.usedBill = bill._id;
    code.usedAt = bill.createdAt;
    await code.save();
  }

  log(`Coupons: ${coupons.length} campaigns, ${allCodes.length} codes (${allCodes.filter((c) => c.used).length} redeemed).`);
  return { coupons, codes: allCodes };
};

const seedBills = async ({ packages, customers, users }) => {
  const billingUsers = users.filter((u) => ["admin", "billing_staff", "cashier", "super_admin"].includes(u.role));
  const paymentModes = ["cash", "cash", "upi", "card", "wallet"];
  const bills = [];

  // ~45 bills spread over the last 30 days (daily/weekly/monthly dashboards all get data)
  const total = 45;
  for (let i = 0; i < total; i++) {
    const pkg = pick(packages);
    const customer = pick(customers);
    const adults = rint(1, 5);
    const children = rint(0, 3);
    const below5 = rnd() < 0.35 ? rint(0, 2) : 0;
    const baseAmount = pkg.price + (pkg.below5Price || 0) * below5;
    const discount = rnd() < 0.08 ? Math.round(baseAmount * 0.1) : 0;
    const dayAgo = Math.floor(rnd() * 30);
    const created = daysAgo(dayAgo, rint(9, 19), rint(0, 59));

    bills.push({
      billNumber: generateBillNumber(),
      customer: customer._id,
      package: pkg._id,
      adults,
      children,
      below5,
      baseAmount,
      discount,
      finalAmount: Math.max(baseAmount - discount, 0),
      paymentMode: pick(paymentModes),
      notes: rnd() < 0.1 ? "Walk-in customer" : undefined,
      createdBy: pick(billingUsers)._id,
      createdAt: created,
    });
  }

  // Force a few bills created today so "daily" dashboard is non-empty
  for (let i = 0; i < 4; i++) {
    bills[i].createdAt = new Date(Date.now() - rint(0, 4 * 60) * MIN);
  }

  const inserted = await Bill.insertMany(bills);
  await Bill.bulkWrite(
    bills.map((b) => ({ updateOne: { filter: { _id: b._id }, update: { $set: { createdAt: b.createdAt } } } }))
  );
  log(`Bills: ${inserted.length} created over the last 30 days.`);
  return inserted;
};

const seedWristTags = async ({ bills, packages, customers }) => {
  const tags = [];
  for (let i = 0; i < bills.length; i++) {
    const bill = bills[i];
    const pkg = packages.find((p) => String(p._id) === String(bill.package));
    const personTypes = [
      ...Array(bill.adults || 0).fill("adult"),
      ...Array(bill.children || 0).fill("child"),
      ...Array(bill.below5 || 0).fill("below5"),
    ];
    if (!personTypes.length) personTypes.push("adult");

    let status, entryTime, expiryTime, exitTime;
    if (i < 3) {
      status = "active";
      entryTime = new Date(Date.now() - rint(20, 90) * MIN);
      expiryTime = new Date(entryTime.getTime() + (pkg ? pkg.durationMinutes : 120) * MIN);
    } else if (i < 6) {
      status = "expired";
      entryTime = daysAgo(rint(1, 3), 10, 0);
      expiryTime = new Date(entryTime.getTime() + (pkg ? pkg.durationMinutes : 120) * MIN);
      exitTime = new Date(expiryTime.getTime() + rint(5, 30) * MIN);
    } else {
      status = "exited";
      entryTime = new Date(bill.createdAt);
      expiryTime = new Date(entryTime.getTime() + (pkg ? pkg.durationMinutes : 120) * MIN);
      exitTime = new Date(expiryTime.getTime() + rint(5, 40) * MIN);
    }

    for (const personType of personTypes) {
      tags.push({
        tagId: generateTagId(),
        qrCodeDataUrl: await generateQRDataUrl(generateTagId()),
        bill: bill._id,
        customer: bill.customer,
        package: bill.package,
        personType,
        adults: personType === "adult" ? 1 : 0,
        children: personType === "child" ? 1 : 0,
        below5: personType === "below5" ? 1 : 0,
        status,
        entryTime,
        expiryTime,
        exitTime,
      });
    }
  }
  const inserted = await WristTag.insertMany(tags);
  log(`WristTags: ${inserted.length} created (${inserted.filter((t) => t.status === "active").length} active for TV display).`);
  return inserted;
};

const seedBookings = async (users) => {
  const adminUser = users.find((u) => u.role === "admin") || users[0];
  const b = (customerName, customerMobile, eventType, daysFromNow, eventTime, guestCount, totalAmount, advancePaid, status) => ({
    customerName,
    customerMobile,
    eventType,
    eventDate: new Date(Date.now() + daysFromNow * DAY),
    eventTime,
    guestCount,
    packageDetails: "Custom party package",
    foodRequirements: "Veg + Non-veg buffet",
    decorationRequirements: "Balloon arch + themed setup",
    additionalActivities: "Cake cutting, games",
    totalAmount,
    advancePaid,
    status,
    createdBy: adminUser._id,
  });

  const bookings = [
    b("Kavitha V", "9876500008", "birthday", 7, "4:00 PM - 7:00 PM", 40, 18000, 5000, "confirmed"),
    b("Sundar Mohan", "9876500102", "corporate", 15, "10:00 AM - 4:00 PM", 120, 65000, 20000, "advance_paid"),
    b("Priya Karthik", "9876500103", "family", 3, "11:00 AM - 2:00 PM", 15, 7500, 0, "enquiry"),
    b("Rajesh Thangam", "9876500104", "birthday", -5, "4:00 PM - 8:00 PM", 50, 22000, 10000, "completed"),
    b("Anitha Raman", "9876500105", "corporate", -12, "9:00 AM - 5:00 PM", 90, 48000, 20000, "completed"),
    b("Mohan Das", "9876500013", "birthday", 20, "3:00 PM - 6:00 PM", 25, 12500, 0, "enquiry"),
    b("Selvi Balan", "9876500014", "family", -2, "11:00 AM - 3:00 PM", 20, 9000, 5000, "completed"),
    b("Vijay Subramanian", "9876500009", "corporate", 30, "10:00 AM - 3:00 PM", 60, 32000, 0, "cancelled"),
  ];

  const inserted = await Booking.insertMany(bookings);
  log(`Bookings: ${inserted.length} created across statuses.`);
  return inserted;
};

const seedAttendance = async (staffList) => {
  const records = [];
  const today = new Date();
  const dateStr = (offset) => {
    const d = new Date(today.getTime() - offset * DAY);
    return dateKey(d);
  };

  for (let s = 0; s < staffList.length; s++) {
    const staff = staffList[s];
    for (let off = 1; off < 30; off++) {
      const r = rnd();
      const date = dateStr(off);
      const rec = { staff: staff._id, date };

      if (r < 0.06) {
        rec.status = "absent";
        rec.notes = "Uninformed leave";
      } else if (r < 0.12) {
        rec.status = "leave";
        rec.notes = "Approved leave";
      } else if (r < 0.2) {
        rec.status = "half-day";
        rec.checkIn = new Date(`${date}T09:00:00`);
        rec.checkOut = new Date(`${date}T13:00:00`);
        rec.notes = "Half day";
      } else {
        rec.status = "present";
        rec.checkIn = new Date(`${date}T09:00:00`);
        rec.checkOut = new Date(`${date}T18:00:00`);
        rec.overtimeHours = rnd() < 0.15 ? rint(1, 3) : 0;
      }
      records.push(rec);
    }
    // Today's record so "staff present today" on the dashboard is populated
    const todayRec = { staff: staff._id, date: dateKey(new Date()), status: "present", checkIn: new Date() };
    if (staff.staffId === "STF0005") todayRec.notes = "Night shift";
    records.push(todayRec);
  }

  await Attendance.insertMany(records);
  log(`Attendance: ${records.length} records created (staff present today seeded).`);
  return records;
};

const run = async () => {
  await connectDB();
  await wipe();

  const packages = await seedPackages();
  const { staffList, users } = await seedStaffAndUsers();
  const customers = await seedCustomers();
  const bills = await seedBills({ packages, customers, users });
  await refreshCustomerStats(customers, bills);
  await seedCoupons(bills);
  await seedWristTags({ bills, packages, customers });
  await seedBookings(users);
  await seedAttendance(staffList);

  log("");
  log("Seeding complete.");
  log("Logins:");
  log("  superadmin@bluewhale.com / superadmin@123   (super_admin)");
  log("  manager@bluewhale.local / Admin@123   (admin)");
  log("  stf0001..stf0006 / <DOB as DDMMYYYY>  (staff logins)");
  log("Package QR/wrist-tag data and coupon codes ready in the DB.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
