require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

mongoose.connect(process.env.MONGO_URI).then(async () => {
  try {
    const superadmin = await User.findOne({ role: "super_admin" });
    if (superadmin) {
      superadmin.username = "bluewhale";
      superadmin.password = "bluewhale";
      await superadmin.save();
      console.log("Super admin credentials updated to bluewhale / bluewhale");
    } else {
      console.log("Super admin not found!");
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
});
