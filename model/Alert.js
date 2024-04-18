// Alert.js
const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema({
  // Define schema fields as per your requirements
  type: String,
  message: String,
  timestamp: { type: Date, default: Date.now }
});

const Alert = mongoose.model("Alert", alertSchema);
module.exports = Alert;
