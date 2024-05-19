const mongoose = require('mongoose');
const DangerZone = require("./DangerZone");

const dangerMarkerSchema = new mongoose.Schema({
  coordinates: {
    type: [Number],
    required: true
  },
  description: String,
  zone: { type: mongoose.Schema.Types.ObjectId, ref: "DangerZone" },
  timestamp: { type: Date, default: Date.now }
});

dangerMarkerSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    const zone = await DangerZone.findById(doc.zone);
    if (zone) {
      const remainingMarkers = await this.model.countDocuments({ zone: zone._id });
      if (remainingMarkers < 10) {
        await DangerZone.findByIdAndDelete(zone._id);
      }
    }
  }
});

const DangerMarker = mongoose.models.DangerMarker || mongoose.model("DangerMarker", dangerMarkerSchema);
module.exports = DangerMarker;