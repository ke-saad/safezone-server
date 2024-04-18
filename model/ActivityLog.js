// ActivityLog.js
const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema({
  // Define schema fields as per your requirements
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  action: String,
  timestamp: { type: Date, default: Date.now }
});

const ActivityLog = mongoose.model("ActivityLog", activityLogSchema);
module.exports = ActivityLog;
