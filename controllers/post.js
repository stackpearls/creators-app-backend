const Post = require("../models/post");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const mongoose = require("mongoose");

//create post
const createPost = asyncHandler(async (req, res) => {
  const { description, media } = req.body;
  const { id: userId } = req.user;

  if (!media || !Array.isArray(media) || media.length === 0) {
    res.status(400).json({ message: "Please attach at least one image" });
    throw new Error("Please attach at least one image");
  }

  const newPost = new Post({ description, media, userId });
  await newPost.save();
  res.status(200).json({ message: "Post added successfully" });
});

//get posts
// const getAllPosts = asyncHandler(async (req, res) => {
//   const { following } = req.body;
//   const { id: userId } = req.user;
//   const limitValue = req.query.limit || 10;
//   const skipValue = req.query.skip || 0;

//   if (following && Array.isArray(following) && !(following.length === 0)) {
//     const posts = await Post.find({ userId: { $in: following } })
//       .limit(limitValue)
//       .skip(skipValue);
//     res.status(200).json({ posts });
//   } else {
//     const posts = await Post.find(userId).limit(limitValue).skip(skipValue);
//     console.log(posts);
//     res.status(200).json(posts);
//   }
// });

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
      {
        $lookup: {
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments",
        },
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          as: "likes",
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
          from: "comments",
          localField: "_id",
          foreignField: "postId",
          as: "comments",
        },
      },

      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          as: "likes",
        },
      },
    ]);

    res.status(200).json(posts);
  }
});

module.exports = { getAllPosts, createPost };
