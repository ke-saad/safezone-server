const mongoose = require("mongoose");

const statutSchema = new mongoose.Schema({
  nom: { type: String, required: true },
});

const Statut = mongoose.model("Statut", statutSchema);
module.exports = Statut;
