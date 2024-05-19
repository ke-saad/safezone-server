const mongoose = require('mongoose');
const SafeZone = require("./SafeZone");

const safetyMarkerSchema = new mongoose.Schema({
  coordinates: {
    type: [Number],
    required: true
  },
  description: String,
  zone: { type: mongoose.Schema.Types.ObjectId, ref: "SafeZone" },
  timestamp: { type: Date, default: Date.now }
});

safetyMarkerSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const zone = await SafeZone.findById(doc.zone);
    if (zone) {
      const remainingMarkers = await this.model.countDocuments({ zone: zone._id });
      if (remainingMarkers < 10) {
        await SafeZone.findByIdAndDelete(zone._id);
      }
    }
  }
});

const SafetyMarker = mongoose.models.SafetyMarker || mongoose.model("SafetyMarker", safetyMarkerSchema);
module.exports = SafetyMarker;