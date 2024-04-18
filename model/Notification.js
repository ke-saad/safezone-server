const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  notifID: { type: mongoose.Schema.Types.ObjectId, required: true },
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  timestamp: { type: Date, default: Date.now },
  message: { type: String, required: true }
});

const Notification = mongoose.model("Notification", notificationSchema);
module.exports = Notification;
