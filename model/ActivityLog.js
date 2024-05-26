const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  action: String,
  username: String, 
  timestamp: { type: Date, default: Date.now }
});

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
module.exports = ActivityLog;
