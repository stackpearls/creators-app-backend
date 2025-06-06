const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: {
    type: String,
    enum: ["stream", "like", "comment", "post", "message"],
    required: true,
  },
  contentId: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  mediaUrl: { type: String }, // Add mediaUrl to store the first image URL if available
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Notification", notificationSchema);
