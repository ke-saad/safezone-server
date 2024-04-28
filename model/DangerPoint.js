// DangerPoint.js
const mongoose = require("mongoose");

const dangerPointSchema = new mongoose.Schema({
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  description: { type: String, required: true },
  // Add any additional fields as needed
});

const DangerPoint = mongoose.model("DangerPoint", dangerPointSchema);
module.exports = DangerPoint;
