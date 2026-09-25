require("dotenv").config();
const mongoose = require("mongoose");
const Package = require("./models/Package");

const seedPackages = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Check if it already exists
    const existing = await Package.findOne({ name: "General Entry" });
    if (!existing) {
      await Package.create({
        name: "General Entry",
        description: "Full day access to all zones",
        price: 600,
        below5Price: 350,
        durationValue: 24, // Assuming full day is essentially a large duration or maybe 8 hours
        durationUnit: "hours",
        durationMinutes: 24 * 60,
        active: true
      });
      console.log("General Entry package seeded successfully!");
    } else {
      console.log("General Entry package already exists.");
      // Optional: update it just in case
      await Package.updateOne({ name: "General Entry" }, { price: 600, below5Price: 350 });
      console.log("Updated General Entry package prices.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error("Error seeding packages:", error);
    process.exit(1);
  }
};

seedPackages();
