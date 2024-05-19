const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  action: String,
  username: String, // Change from user ID to username
  timestamp: { type: Date, default: Date.now }
});

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
module.exports = ActivityLog;
