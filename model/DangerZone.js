const mongoose = require("mongoose");

const dangerZoneSchema = new mongoose.Schema({
  markers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "DangerMarker"
  }],
  timestamp: { type: Date, default: Date.now }
}, { collection: "dangerzones" });

const DangerZone = mongoose.model("DangerZone", dangerZoneSchema);
module.exports = DangerZone;