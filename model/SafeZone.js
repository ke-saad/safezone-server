const mongoose = require('mongoose');

const safeZoneSchema = new mongoose.Schema({
  markers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "SafetyMarker"
  }],
  timestamp: { type: Date, default: Date.now }
}, { collection: "safezones" });

const SafeZone = mongoose.models.SafeZone || mongoose.model("SafeZone", safeZoneSchema);
module.exports = SafeZone;