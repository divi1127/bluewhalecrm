require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");
const Staff = require("./models/Staff");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    await User.deleteMany({ email: { $ne: "superadmin@bluewhale.com" } });
    await Staff.deleteMany({});
    console.log("Successfully deleted dummy staff and users, kept superadmin.");
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});
