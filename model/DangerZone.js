const mongoose = require("mongoose");

const dangerZoneSchema = new mongoose.Schema({
  coordinates: [{ type: Number, required: true }] // Array of coordinates [longitude, latitude]
});

const DangerZone = mongoose.model("DangerZone", dangerZoneSchema);
module.exports = DangerZone;
