const mongoose = require('mongoose');

const safeZoneSchema = new mongoose.Schema({
  markers: [{
    coordinates: [Number],
    place_name: String,
    context: [mongoose.Schema.Types.Mixed],
    timestamp: Date,
    region_id: String,
    country_name: String,
    short_code: String,
  }],
  timestamp: { type: Date, default: Date.now }
}, { collection: "safezones" });

const SafeZone = mongoose.models.SafeZone || mongoose.model("SafeZone", safeZoneSchema);
module.exports = SafeZone;
