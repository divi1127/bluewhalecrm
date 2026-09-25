require("dotenv").config();
const mongoose = require("mongoose");
const Attendance = require("./models/Attendance");
const AttendanceSetting = require("./models/AttendanceSetting");
const Bill = require("./models/Bill");
const Booking = require("./models/Booking");
const Coupon = require("./models/Coupon");
const CouponCode = require("./models/CouponCode");
const Customer = require("./models/Customer");
const Enquiry = require("./models/Enquiry");
const Package = require("./models/Package");
const Staff = require("./models/Staff");
const User = require("./models/User");
const WristTag = require("./models/WristTag");

const clearDb = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Comment out or remove User if you want to keep admin accounts
    await Promise.all([
      Attendance.deleteMany({}),
      AttendanceSetting.deleteMany({}),
      Bill.deleteMany({}),
      Booking.deleteMany({}),
      Coupon.deleteMany({}),
      CouponCode.deleteMany({}),
      Customer.deleteMany({}),
      Enquiry.deleteMany({}),
      Package.deleteMany({}),
      Staff.deleteMany({}),
      // User.deleteMany({}), // Be careful dropping Users, you may lock yourself out!
      WristTag.deleteMany({}),
    ]);

    console.log("Successfully deleted all module data (excluding Users)");
    process.exit(0);
  } catch (error) {
    console.error("Error clearing database:", error);
    process.exit(1);
  }
};

clearDb();
