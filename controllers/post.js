const Post = require("../models/post");
const Like = require("../models/like");
const Comment = require("../models/comment");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

//create post
const createPost = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { description } = req.body;
  const { id: userId } = req.user;

  if (!req.files || req.files.length === 0) {
    return res
      .status(400)
      .json({ message: "Please attach at least one image" });
  }
  const media = req.files.map((file) => `/uploads/${file.filename}`);
  const newPost = new Post({ description, media, userId });
  await newPost.save();
  res.status(200).json({ message: "Post added successfully" });
});

const getAllPosts = asyncHandler(async (req, res) => {
  const { following } = req.body;
  const { _id: userId } = req.user;

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
          userId: userId,
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

      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "postId",
          as: "likes",
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
        $addFields: {
          totalLikes: { $size: "$likes" },
          totalComments: { $size: "$comments" },
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

const deletePost = asyncHandler(async (req, res) => {
  const postId = req.params.postId;

  if (!postId) {
    return res.status(400).json({ message: "Bad request: postId is required" });
  }

  const session = await Post.startSession();
  session.startTransaction();
  try {
    const deletedPost = await Post.findByIdAndDelete(postId);
    console.log(deletedPost);
    if (!deletedPost) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: "Post not found" });
    }

    deletedPost.media.forEach((file) => {
      const filePath = path.join(__dirname, "../", file);
      console.log(filePath);

      fs.unlink(filePath, (err) => {
        if (err) {
          console.log(`Failed to deleted file : ${filePath}`, err);
        } else {
          console.log(`Successfully deleted file : ${filePath}`);
        }
      });
    });

    await Like.deleteMany({ postId }, { session });

    await Comment.deleteMany({ postId }, { session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({ message: "Post deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message: "Error occurred during deletion",
      error: error.message,
    });
  }
});

module.exports = { getAllPosts, createPost, deletePost };
