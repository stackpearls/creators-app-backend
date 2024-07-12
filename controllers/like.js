const asyncHandler = require("express-async-handler");

const Like = require("../models/like");
const Post = require("../models/post");

//add like
const addLike = asyncHandler(async (req, res) => {
  const { postId } = req.body;
  const postExists = await Post.findById(postId);

  if (!postExists) {
    res.status(404).json({ message: "Post does not exists" });
    throw new Error("Post does not exists");
  }

  const newLike = new Like({
    postId,
    userId: req.user.id,
  });

  newLike.save();

  res.status(200).json({ message: "Like is added" });
});

//delete like
const deleteLike = asyncHandler(async (req, res) => {
  const likeId = req.params.id;

  const likeExists = await Like.findById(likeId);

  if (!likeExists) {
    res.status(404).json({ message: "Like does not exists" });
    throw new Error("Like does not exists");
  }

  await Like.findByIdAndDelete(likeId);

  res.status(200).json({ message: "Like is deleted" });
});

module.exports = { addLike, deleteLike };
