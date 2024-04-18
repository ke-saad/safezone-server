const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema({
  repID: { type: mongoose.Schema.Types.ObjectId, required: true },
  userID: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  type: { type: String, required: true }
});

const Report = mongoose.model("Report", reportSchema);
module.exports = Report;
