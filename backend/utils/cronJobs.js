const cron = require('node-cron');
const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');

const initCronJobs = () => {
  // Run every day at 20:00 (8:00 PM)
  cron.schedule('0 20 * * *', async () => {
    console.log("Running attendance cron job at 8:00 PM...");
    try {
      const today = new Date().toISOString().slice(0, 10);
      
      // Find all active staff members
      const activeStaff = await Staff.find({ active: true });
      
      for (const staff of activeStaff) {
        let record = await Attendance.findOne({ staff: staff._id, date: today });
        if (!record) {
          // If no record exists by 8 PM, mark as leave
          await Attendance.create({
            staff: staff._id,
            date: today,
            status: "leave",
            notes: "Auto-marked as leave by system at 8:00 PM (No check-in)"
          });
        }
      }
      console.log("Attendance cron job completed successfully.");
    } catch (error) {
      console.error("Error in attendance cron job:", error);
    }
  });
};

module.exports = initCronJobs;
