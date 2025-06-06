const Post = require("../models/post");
const Like = require("../models/like");
const Comment = require("../models/comment");
const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");
const Subscription = require("../models/subscription");

//create post
const createPost = asyncHandler(async (req, res) => {
  console.log(req.body);
  const { description, tier } = req.body;

  const { id: userId } = req.user;

  if (!req.files || req.files.length === 0) {
    return res
      .status(400)
      .json({ message: "Please attach at least one image" });
  }

  const media = req.files.map((file) => `/uploads/${file.filename}`);
  const newPost = new Post({ description, media, userId, tier });
  try {
    await Promise.all([
      newPost.save(),
      User.findByIdAndUpdate(userId, { $inc: { totalPosts: 1 } }),
    ]);
    res
      .status(200)
      .json({ message: "Post added successfully", postId: newPost._id });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

const getAllPosts = asyncHandler(async (req, res) => {
  const following = req.params.following;

  const { _id: userId } = req.user;

  if (following === "true") {
    const user = await User.findById(userId).select("following");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const posts = await Post.aggregate([
      {
        $match: {
          userId: { $in: user.following }, // Only posts from followed users
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
          "user.password": 0, // Exclude sensitive information
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
    return res.status(200).json(posts);
  }
  if (following === "false") {
    console.log("Inside Following === false");
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
const getSingleUserPost = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.params.userId);
  console.log(userId, "Type is: ", typeof userId);
  const userExists = await User.findById(userId);

  if (!userExists) {
    return res.status(404).json({ message: "No user found" });
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

  return res.status(200).json(posts);
});

const getSingleUserPostsWithSubscription = asyncHandler(async (req, res) => {
  const userId = new mongoose.Types.ObjectId(req.params.userId); // Creator's userId
  const requestingUserId = req.user._id; // ID of the user making the request (assume it's attached to req.user)

  // Check if the requesting user is subscribed to the creator
  const isSubscribed = await Subscription.findOne({
    buyerId: requestingUserId,
    creatorId: userId,
    status: "active",
  });

  // Set a filter based on subscription status
  const postFilter = {
    userId: userId,
    ...(isSubscribed ? {} : { tier: "free" }), // If not subscribed, only fetch "free" posts
  };

  // Fetch posts based on the filter
  const posts = await Post.aggregate([
    {
      $match: postFilter,
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

  // Respond with posts and subscription status
  return res.status(200).json(posts);
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
    const likeCount = await Like.countDocuments({ postId });
    await Like.deleteMany({ postId }, { session });

    await Comment.deleteMany({ postId }, { session });
    await User.findByIdAndUpdate(
      deletedPost.userId,
      { $inc: { totalLikes: -likeCount, totalPosts: -1 } },
      { session }
    );

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

const getSinglePost = asyncHandler(async (req, res) => {
  const postId = req.params.postId;

  const post = await Post.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(postId), // Match the post by its ID
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
        "user.password": 0, // Exclude the user's password field
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
  ]);

  if (!post.length) {
    return res.status(404).json({ message: "No such post found" });
  }

  res.status(200).json({ post: post[0] }); // Return the first matching post
});

const getUserPosts = asyncHandler(async (req, res) => {
  if (req.params.id) {
    const loggedInUser = await User.findById(req.params.id, null, null).then();

    let subscribedUsers = [];
    let unsubscribedUsers = [];

    for (let id of loggedInUser.following) {
      const subscription = await Subscription.findOne(
        {
          buyerId: req.params.id,
          creatorId: id,
          status: "active",
        },
        null,
        null
      );

      subscription ? subscribedUsers.push(id) : unsubscribedUsers.push(id);
    }

    const postFilter =
      subscribedUsers.length > 0
        ? {
            $or: [
              { userId: { $in: subscribedUsers } },
              { userId: { $in: unsubscribedUsers }, tier: "free" },
            ],
          }
        : { userId: { $in: loggedInUser.following }, tier: "free" };

    const posts = await Post.aggregate([
      { $match: postFilter },
      {
        $lookup: {
          from: "users",
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },
      { $project: { "user.password": 0 } },
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
      { $sort: { createdAt: -1 } }, // Sort by latest posts
    ]);

    return res.status(200).json(posts);
  }

  return res.status(200).json([]);
});

module.exports = {
  getAllPosts,
  createPost,
  deletePost,
  getSinglePost,
  getSingleUserPostsWithSubscription,
  getUserPosts,
};
