const mongoose = require("mongoose");

const markerSchema = new mongoose.Schema({
  coordinates: {
    type: [Number], // Expecting [longitude, latitude]
    required: true,
    validate: {
      validator: function (coords) {
        return coords.length === 2; // Must be exactly two elements for coordinates
      },
      message: "Coordinates must be an array of [longitude, latitude]"
    }
  }
});

const safeZoneSchema = new mongoose.Schema({
  markers: {
    type: [markerSchema],
    validate: {
      validator: function (v) {
        return v.length === 10; // Ensure exactly 10 markers
      },
      message: "There must exactly be 10 markers"
    }
  }
}, { collection: 'safezones' });

const SafeZone = mongoose.model("SafeZone", safeZoneSchema);
module.exports = SafeZone;
