const mongoose = require("mongoose");

const safetySchema = new mongoose.Schema({
  // Define schema fields as per your requirements
});

const Safety = mongoose.model("Safety", safetySchema);
module.exports = Safety;
