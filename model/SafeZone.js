// models/SafeZone.js
const mongoose = require("mongoose");

const safeZoneSchema = new mongoose.Schema({
  markers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "SafetyMarker"
  }]
}, { collection: "safezones" });

const SafeZone = mongoose.model("SafeZone", safeZoneSchema);
module.exports = SafeZone;
