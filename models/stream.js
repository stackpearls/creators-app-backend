const mongoose = require("mongoose");

const streamSchema = new mongoose.Schema({
  channel: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
});

module.exports = mongoose.model("Stream", streamSchema);
