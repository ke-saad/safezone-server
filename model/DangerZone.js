const mongoose = require('mongoose');

const dangerZoneSchema = new mongoose.Schema({
  markers: [{
    coordinates: [Number],
    description: String,
    place_name: String,
    context: [mongoose.Schema.Types.Mixed],
    timestamp: Date,
    region_id: String,
    country_name: String,
    short_code: String,
  }],
  timestamp: { type: Date, default: Date.now }
}, { collection: "dangerzones" });

const DangerZone = mongoose.models.DangerZone || mongoose.model("DangerZone", dangerZoneSchema);
module.exports = DangerZone;
