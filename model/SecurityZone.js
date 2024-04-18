const mongoose = require("mongoose");

const securityZoneSchema = new mongoose.Schema({
  // Define schema fields as per your requirements
});

const SecurityZone = mongoose.model("SecurityZone", securityZoneSchema);
module.exports = SecurityZone;
