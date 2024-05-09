// models/DangerZone.js
const mongoose = require("mongoose");

const dangerZoneSchema = new mongoose.Schema({
  markers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "DangerMarker"
  }]
}, { collection: "dangerzones" });

const DangerZone = mongoose.model("DangerZone", dangerZoneSchema);
module.exports = DangerZone;
