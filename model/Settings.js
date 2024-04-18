const mongoose = require("mongoose");

const settingsSchema = new mongoose.Schema({
  // Define schema fields as per your requirements
});

const Settings = mongoose.model("Settings", settingsSchema);
module.exports = Settings;
