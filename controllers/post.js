const Post = require("../models/post");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const mongoose = require("mongoose");

//create post
const createPost = asyncHandler(async (req, res) => {
  const { description } = req.body;
  const { id: userId } = req.user;

  if (!req.files || req.files.length === 0) {
    res.status(400).json({ message: "Please attach at least one image" });
    throw new Error("Please attach at least one image");
  }
  const media = req.files.map((file) => `/uploads/${file.filename}`);
  const newPost = new Post({ description, media, userId });
  await newPost.save();
  res.status(200).json({ message: "Post added successfully" });
});

const getAllPosts = asyncHandler(async (req, res) => {
  const { following } = req.body;
  const { id: userId } = req.user;

  if (following && Array.isArray(following) && following.length > 0) {
    const posts = await Post.aggregate([
      {
        $match: {
          userId: {
            $in: following.map((id) => new mongoose.Types.ObjectId(id)),
          },
        },
      },

      // {
      //   $lookup: {
      //     from: "comments",
      //     localField: "_id",
      //     foreignField: "postId",
      //     as: "comments",
      //   },
      // },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          as: "likes",
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    res.status(200).json(posts);
  } else {
    const userExists = await User.findById(userId);

    if (!userExists) {
      res.status(404).json({ message: "No user found" });
    }

    const posts = await Post.aggregate([
      {
        $match: {
          userId: mongoose.Types.ObjectId,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      {
        $unwind: "$user",
      },
      {
        $project: {
          "user.password": 0,
        },
      },
      // {
      //   $lookup: {
      //     from: "comments",
      //     localField: "_id",
      //     foreignField: "postId",
      //     as: "comments",
      //   },
      // },

      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          as: "likes",
        },
      },
      {
        $addFields: {
          totalLikes: { $size: "$likes" },
        },
      },
      {
        $sort: {
          createdAt: -1,
        },
      },
    ]);

    res.status(200).json(posts);
  }
});

module.exports = { getAllPosts, createPost };
