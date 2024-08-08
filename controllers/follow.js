const User = require("../models/user");
const asyncHandler = require("express-async-handler");

//follow user
const followUnfollowUser = asyncHandler(async (req, res) => {
  const { userIdToFollow, followIsTrue } = req.body;

  const { id: userId } = req.user;
  if (!userIdToFollow) {
    res.status(400).json({ message: "User id to follow/unfollow is required" });
    throw new Error("User id to follow/unfollow is required ");
  }

  const userToFollow = await User.findById(userIdToFollow);

  if (!userToFollow) {
    res.status(404).json({ message: "User to follow/unfollow is not found" });
  }

  const user = await User.findById(userId);

  if (followIsTrue) {
    if (!user.following.includes(userIdToFollow)) {
      user.following.push(userIdToFollow);
      await user.save();

      res.status(200).json({ message: "User has been followed successfully" });
    } else {
      res.status(400).json({ message: "User already  followed by the you" });
      throw new Error("User is already followed by you");
    }
  } else if (!followIsTrue) {
    if (user.following.includes(userIdToFollow)) {
      const index = user.following.indexOf(userIdToFollow);

      user.following.splice(index, 1);
      await user.save();

      res
        .status(200)
        .json({ message: "User has been unfollowed successfully" });
    } else {
      res.status(400).json({ message: "User is not followed by the you" });
      throw new Error("User is not followed by you");
    }
  }
});

module.exports = { followUnfollowUser };
