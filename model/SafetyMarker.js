const mongoose = require('mongoose');
const SafeZone = require("./SafeZone");

const safetyMarkerSchema = new mongoose.Schema({
  coordinates: {
    type: [Number],
    required: true
  },
  place_name: String,
  context: [mongoose.Schema.Types.Mixed],
  timestamp: { type: Date, default: Date.now },
  region_id: String,
  country_name: String,
  short_code: String,
  zone: { type: mongoose.Schema.Types.ObjectId, ref: "SafeZone" }
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
