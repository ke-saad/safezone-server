const mongoose = require("mongoose");

const securityZoneSchema = new mongoose.Schema({
  coordinates: [{ type: [Number], required: true }] // Array of coordinates [longitude, latitude]
});

const SecurityZone = mongoose.model("SecurityZone", securityZoneSchema);
module.exports = SecurityZone;
