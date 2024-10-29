const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const Like = require("../models/like");
const Post = require("../models/post");

//add like
const addLike = asyncHandler(async (req, res) => {
  const { postId, postUID } = req.body;
  const { _id: userId } = req.user;

  const likeExists = await Like.findOne({ userId, postId });

  if (likeExists) {
    res.status(400).json({ message: "Already liked by user" });
    return;
  }

  const newLike = new Like({
    postId,
    userId: userId,
  });

  try {
    await Promise.all([
      newLike.save(),
      User.findByIdAndUpdate(postUID, { $inc: { totalLikes: 1 } }),
    ]);

    res.status(200).json({ message: "Like is added" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//delete like
const deleteLike = asyncHandler(async (req, res) => {
  const { postId, postUID } = req.body;
  const { _id: userId } = req.user;

  const likeExists = await Like.findOne({ postId, userId });

  if (!likeExists) {
    res.status(404).json({ message: "Like does not exists" });
    throw new Error("Like does not exists");
  }

  try {
    await Promise.all([
      Like.findByIdAndDelete(likeExists._id),
      User.findByIdAndUpdate(postUID, { $inc: { totalLikes: -1 } }),
    ]);

    res.status(200).json({ message: "Like is deleted" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = { addLike, deleteLike };
