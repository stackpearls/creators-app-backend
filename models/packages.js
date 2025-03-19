const mongoose = require("mongoose");

const packagesSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  priceId: { type: String, required: true },
  packageName: { type: String, required: true },
  priceAmount: { type: String, required: true },
  currency: { type: String, required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Packages", packagesSchema);
