const asyncHandler = require("express-async-handler");

const Like = require("../models/like");
const Post = require("../models/post");

//add like
const addLike = asyncHandler(async (req, res) => {
  const { postId } = req.body;
  const { _id: userId } = req.user;
  console.log(userId);

  const likeExists = await Like.findOne({ userId, postId });

  if (likeExists) {
    res.status(400).json({ message: "Already liked by user" });
    return;
  }

  const newLike = new Like({
    postId,
    userId: userId,
  });

  newLike.save();

  res.status(200).json({ message: "Like is added" });
});

//delete like
const deleteLike = asyncHandler(async (req, res) => {
  const { postId } = req.body;
  const { _id: userId } = req.user;

  const likeExists = await Like.findOne({ postId, userId });
  console.log(likeExists);

  if (!likeExists) {
    res.status(404).json({ message: "Like does not exists" });
    throw new Error("Like does not exists");
  }

  await Like.findByIdAndDelete(likeExists._id);

  res.status(200).json({ message: "Like is deleted" });
});

module.exports = { addLike, deleteLike };
