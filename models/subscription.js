const mongoose = require("mongoose");

const subscriptionSchema = new mongoose.Schema({
  buyerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  creatorId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User",
  },
  priceId: { type: String, required: true },
  subscriptionId: { type: String, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  subscriptionEndDate: { type: Date },
});

module.exports = mongoose.model("Subscription", subscriptionSchema);
