const User = require("../models/user");
const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");

const authorizeUser = asyncHandler(async (req, res, next) => {
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      const tokenReceived = req.headers.authorization.split(" ")[1];

      const userDecoded = await jwt.verify(
        tokenReceived,
        process.env.SECRET_KEY
      );
      console.log(userDecoded.id);
      const user = await User.findOne({ _id: userDecoded.id });
      console.log(user);
      if (user) {
        req.user = user;
        next();
      } else {
        res.status(404).json({ message: "User not found" });
        throw new Error("User not found");
      }
    } catch (error) {
      res.status(401).json({ message: "User not authorized 1" });
      throw new Error("User not authorized");
    }
  } else {
    res.status(401).json({
      message: "User not authorized 2",
    });
    throw new Error("User not authorized");
  }
});

module.exports = { authorizeUser };
