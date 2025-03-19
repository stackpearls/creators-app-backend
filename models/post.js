const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  description: { type: String },
  media: { type: [String], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  createdAt: { type: Date, default: Date.now },
  tier: { type: String, enum: ["free", "paid"], default: "free" },
});

module.exports = mongoose.model("Post", postSchema);
