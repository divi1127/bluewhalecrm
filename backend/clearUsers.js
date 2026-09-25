require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

const clearUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Delete all users except those with role 'super_admin'
    const result = await User.deleteMany({ role: { $ne: "super_admin" } });
    
    console.log(`Successfully deleted ${result.deletedCount} non-super_admin users.`);
    process.exit(0);
  } catch (error) {
    console.error("Error clearing users:", error);
    process.exit(1);
  }
};

clearUsers();
