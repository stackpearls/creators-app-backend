const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const post = require("../models/post");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const { v4: uuidv4 } = require('uuid');
const sendEmail = require("../configurations/sendEmail");
const generateEmailHTML = require("../templates/emailTemplate").generateEmailHTML;

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
const getSingleUser = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.params.userId);
  const user = await User.findById(userId).select([
    "-password",
    "-google_id",
    "-facebook_id",
    "-email",
  ]);

  if (!user) {
    return res.status(404).json({ message: "No such user found" });
  }
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    username: user.username,
    profile: user.profile,
    coverImage: user.coverImage,
    age: user.age,
    gender: user.gender,
    role: user.role,
    bio: user.bio,
    priceID: user.priceID,
    location: user.location,
    totalLikes: user.totalLikes,
    totalPosts: user.totalPosts,
    creator: user.creator,
    attachmentsForCreator: user.attachmentsForCreator,
    creatorVerificationStatus: user.creatorVerificationStatus,
    createdAt:
      user.createdAt.getDate() +
      "-" +
      user.createdAt.getMonth() +
      "-" +
      user.createdAt.getFullYear(),
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
const searchUsers = asyncHandler(async (req, res) => {
  const { query } = req.query; // Get the search query from query parameters

  if (!query) {
    return res.status(400).json({ message: "Query cannot be empty." });
  }

  // Use a regular expression to perform a case-insensitive search
  const regex = new RegExp(`${query}`, "i");
  console.log("Generated Regex:", regex);

  // Search only by username
  const users = await User.find({
    name: { $regex: regex },
    role: "creator",
  })
    .select("-password -__v") // Exclude sensitive information like password
    .limit(10); // Limit results for performance

  return res.status(200).json(users);
});

const requestForCreator = asyncHandler(async (req, res) => {
  const creator = uuidv4('', '', '');
  const attachmentsForCreator = [];

  for (let keys of Object.keys(req.files)) {
    attachmentsForCreator.push({
      name: `/uploads/${req.files[keys][0].filename}`,
      originalName: req.files[keys][0].originalname,
      size: req.files[keys][0].size
    });
  }

  const userUpdated = await User.findByIdAndUpdate(req.params.id,  {creator, attachmentsForCreator, creatorVerificationStatus: 'PENDING'}, {
    new: true,
  });

  if (userUpdated) {
    res.status(200).json({'message': 'Request for creator has been sent to admin for verification'});
    await sendEmail(
        'farhaniftikhar16f16@gmail.com',
        `Request To Verify ${userUpdated.name} As Creator`,
        null,
        generateEmailHTML(attachmentsForCreator, userUpdated));
  } else {
    res.status(404).json({ message: 'User not found' });
  }
});

const creatorVerificationApproved = asyncHandler(async (req, res) => {
  const userVerified = await User.findOne({creator: req.params.verificationToken, creatorVerificationStatus: 'VERIFIED'});

  if (userVerified) {
    res.status(400).json({ message: `${userVerified.name} is already verified and a creator`});
    return;
  }

  if (!userVerified && req.params.status === 'rejected') {
    const user =  await User.findOneAndUpdate({creator: req.params.verificationToken}, {creatorVerificationStatus: 'REJECTED'}, {
      new: true,
    })
    res.status(200).json({message: `${user.name} request for creator has been rejected`});
    return;
  }

  if (!userVerified && req.params.status === 'verified') {
    const user =  await User.findOneAndUpdate({creator: req.params.verificationToken},  {creatorVerificationStatus: 'VERIFIED', role: 'creator'}, {
      new: true,
    });

    res.status(200).json({message: `${user.name} has been successfully verified and becomes a creator`});
    return;
  }

  res.status(404).json({ message: 'User not found' });
});


module.exports = {
  getUsers,
  deleteUser,
  updateUser,
  getFollowingUsers,
  searchUsers,
  getSingleUser,
  requestForCreator,
  creatorVerificationApproved
};
