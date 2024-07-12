const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  description: { type: String },
  media: { type: [String], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  createdAt: { type: Date, defualt: Date.now },
});

module.exports = mongoose.model("Post", postSchema);
