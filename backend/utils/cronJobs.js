const cron = require('node-cron');
const Staff = require('../models/Staff');
const Attendance = require('../models/Attendance');

const initCronJobs = () => {
  // Auto checkout at 22:15 (10:15 PM)
  cron.schedule('15 22 * * *', async () => {
    console.log("Running auto-checkout at 10:15 PM...");
    try {
      const today = new Date().toISOString().slice(0, 10);
      const records = await Attendance.find({ date: today, checkIn: { $ne: null }, checkOut: null });
      for (const record of records) {
        record.checkOut = new Date();
        record.notes = record.notes ? record.notes + " | Auto-checked out at 10:15 PM" : "Auto-checked out at 10:15 PM";
        await record.save();
      }
      console.log(`Auto-checkout completed for ${records.length} staff.`);
    } catch (err) {
      console.error("Error in auto-checkout cron job:", err);
    }
  });

  // Run every day at 23:30 (11:30 PM)
  cron.schedule('30 23 * * *', async () => {
    console.log("Running attendance cron job at 11:30 PM...");
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
