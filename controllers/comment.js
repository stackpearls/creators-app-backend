const Comment = require("../models/comment");
const asyncHandler = require("express-async-handler");
//add comment
const addComment = asyncHandler(async (req, res) => {
  const { comment, postId } = req.body;
  const { _id: userId } = req.user;
  if (!comment || !postId) {
    res.status(400).json({ message: "Please provide complete comment data" });
    throw new Error("Please provide complete comment data");
  }
  const newComment = new Comment({ comment, postId, userId });
  await newComment.save();
  res.status(200).json({ message: "Comment added successfully" });
});

//delete comment
const deleteComment = asyncHandler(async (req, res) => {
  const commentId = req.params.id;
  if (!commentId) {
    res.status(400).json({ message: "Comment ID is required" });
    throw new Error("Comment ID is required");
  }
  const commentExists = await Comment.findById(commentId);
  if (!commentExists) {
    res.status(404).json({ message: "Comment does not exist" });
    throw new Error("Comment Does not exists");
  }

  await Comment.findByIdAndDelete(commentId);

  res.status(200).json({ message: "Comment deleted successfully" });
});

//update comment
const updateComment = asyncHandler(async (req, res) => {
  const commentId = req.params.id;
  const { comment } = req.body;
  console.log(commentId + " new comment" + comment);
  if (!commentId || !comment) {
    res
      .status(400)
      .json({ message: "Please provide complete updated comment" });
    throw new Error("Please provide complete updated comment");
  }

  const commentExists = await Comment.findById(commentId);
  if (!commentExists) {
    res.status(404).json({ message: "Comment is not found" });
  }
  await Comment.findByIdAndUpdate(commentId, {
    comment: comment,
  });

  res.status(200).json({ message: "Comment has been updated successfully" });
});

module.exports = { addComment, deleteComment, updateComment };
