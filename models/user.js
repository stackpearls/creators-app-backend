const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profile: { type: String, default: "/uploads/default_profile_picture.png" },
  coverImage: { type: String, default: "/uploads/default_cover_picture.jpg" },
  google_id: { type: String },
  facebook_id: { type: String },
  location: { type: String },
  active: { type: Boolean, default: false },
  bio: { type: String },
  totalLikes: { type: Number, default: 0 },
  totalPosts: { type: Number, default: 0 },
  role: {
    type: String,
    enum: ["creator", "subscriber"],
    default: "subscriber",
  },
  age: {
    type: String,
    required: false,
  },
  gender: {
    type: String,
    enum: ["male", "female"],
  },
  verified: {
    type: Boolean,
    default: false,
  },
  following: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  priceID: { type: String },
  creator: { type: String },
  attachmentsForCreator: [{ name: {type: String}, originalName: {type: String}, size: {type: Number}} ],
  creatorVerificationStatus: {
    type: String,
    enum: ["VERIFIED", "NOT_VERIFIED", "REJECTED"],
    default: "NOT_VERIFIED",
  }
});

userSchema.pre("save", async function (next) {
  const user = this;
  if (!this.isModified) {
    next();
  } else {
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(user.password, salt);
    user.password = hash;
  }
});

module.exports = mongoose.model("User", userSchema);
