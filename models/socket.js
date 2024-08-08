const mongoose = require("mongoose");

const socketSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  socketId: { type: String, required: true },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now() },
});

module.exports = mongoose.model("Socket", socketSchema);
