const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const post = require("../models/post");
const fs = require("fs");
const path = require("path");

const getUsers = asyncHandler(async (req, res) => {
  console.log("Here ");
  const { _id: userId } = req.user;
  const currentUser = await User.findById(userId).select("following");
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 3;
  const skip = (page - 1) * limit;
  const users = await User.find({
    _id: {
      $ne: userId,
      $nin: currentUser.following,
    },
    verified: true,
  })
    .select(["-password", "-google_id", "-facebook_id", "-email"])
    .skip(skip)
    .limit(limit);
  const totalUsers = await User.countDocuments({
    _id: {
      $ne: userId,
      $nin: currentUser.following,
    },
    verified: true,
  });

  res.status(200).json({
    users,
    currentPage: page,
    totalPages: Math.ceil(totalUsers / limit),
    totalUsers,
  });
});
const getFollowingUsers = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const currentUser = await User.findById(userId).select("following");
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 5;
  const skip = (page - 1) * limit;
  const users = await User.find({
    _id: {
      $ne: userId,
      $in: currentUser.following,
    },
    verified: true,
  }).select(["-password", "-google_id", "-facebook_id", "-email"]);
  // .skip(skip)
  // .limit(limit);
  const totalUsers = await User.countDocuments({
    _id: {
      $ne: userId,
      $nin: currentUser.following,
    },
    verified: true,
  });

  res.status(200).json({
    users,
    currentPage: page,
    totalPages: Math.ceil(totalUsers / limit),
    totalUsers,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  const userDeleted = await User.findByIdAndDelete(userId);

  if (userDeleted) {
    await post.deleteMany({ userId: userId });

    const uploadDir = path.join(__dirname, "..", "uploads");

    fs.readdir(uploadDir, (err, files) => {
      if (err) {
        throw err;
      }

      files.forEach((file) => {
        if (file.startsWith(userId)) {
          fs.unlink(path.join(uploadDir, file), (err) => {
            if (err) {
              throw err;
            }
          });
        }
      });
    });
    res.status(200).json({ message: "User deleted successfully" });
    return;
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, bio, location } = req.body;
  const { _id: userId } = req.user;

  const updatedFields = {};

  if (name !== undefined) updatedFields.name = name;
  if (bio !== undefined) updatedFields.bio = bio;
  if (location !== undefined) updatedFields.location = location;

  if (req.files) {
    if (req.files.profile)
      updatedFields.profile = `/uploads/${req.files.profile[0].filename}`;
    if (req.files.cover_image)
      updatedFields.coverImage = `/uploads/${req.files.cover_image[0].filename}`;
  }

  const userUpdated = await User.findByIdAndUpdate(userId, updatedFields, {
    new: true,
  });

  if (userUpdated) {
    res.status(200).json({
      profile: userUpdated.profile,
      cover_image: userUpdated.coverImage,
      name: userUpdated.name,
      location: userUpdated.location,
      bio: userUpdated.bio,
    });
  } else {
    res.status(404).json({ message: "User not found" });
  }
});

module.exports = { getUsers, deleteUser, updateUser, getFollowingUsers };
