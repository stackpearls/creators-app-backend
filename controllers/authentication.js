const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const generateToken = require("../configurations/generateToken");
const sendEmail = require("../configurations/sendEmail");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//register
const registerUser = asyncHandler(async (req, res) => {
  const { name, email, password, role, gender, age } = req.body;

  if (!name || !email || !password || !role || !gender || !age) {
    res.status(400).json({ message: "fields are not defined correctly" });
    throw new Error("fields not defined properly");
  }

  const userAlreadExists = await User.findOne({ email });

  if (userAlreadExists) {
    res.status(400).json({ message: "User already exists" });
    throw new Error("User already exists");
  }
  const newUser = new User({ name, email, password, role, gender, age });
  await newUser.save();
  const token = generateToken(newUser._id, newUser.role, "2h");
  if (newUser) {
    const url = `${process.env.BASE_URL}:3000/verify/${newUser.id}/${token}`;
    await sendEmail(email, "Fanvue Verification", url);
    res.status(200).json({
      newUser,
      url,
    });
  } else {
    res.status(400).json({ message: "Failed to register user" });
    throw new Error("Failed to register user");
  }
});

//verify
const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.find({ _id: req.params.id });

  if (!user[0]) {
    return res.status(400).send({ message: "Invalid link" });
  }

  const userDecoded = jwt.verify(req.params.token, process.env.SECRET_KEY);

  if (req.params.id !== userDecoded.id)
    return res.status(400).send({ message: "Invalid link" });
  const response = await User.findByIdAndUpdate(userDecoded.id, {
    verified: true,
  });
  res.status(200).send({ response, message: "Email verified successfully" });
});

//login
const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user && user.verified) {
    const passwwordMatched = await bcrypt.compare(password, user.password);

    if (passwwordMatched) {
      const refreshToken = generateToken(user._id, user.role, "7d");

      const cookies = req.cookies;

      res.cookie("jwt", refreshToken, {
        httpOnly: true,

        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        profile: user.profile,
        coverImage: user.coverImage,
        age: user.age,
        gender: user.gender,
        role: user.role,
      });
    } else {
      res.status(400).json({ message: "Please check your credentials" });
      throw new Error("Please check your credentials");
    }
  } else {
    res.status(400).json({
      message: "Failed to login",
    });
    throw new Error("Failed to login");
  }
});

//logout
const logoutUser = asyncHandler(async (req, res) => {
  const cookies = req.cookies;

  if (!cookies?.jwt) {
    res.status(204);
  }

  res.clearCookie("jwt", { httpOnly: true });
  res.status(200).json({ message: "Logged Out Successfully" });
});

//forgetPassword
const forgetPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ email });

  if (user) {
    const token = generateToken(user._id, user.role, "1m");
    const url = `${process.env.BASE_URL}:${process.env.PORT}/forgetpassword/${token}`;
    await sendEmail(email, "Reset Password", url);
    res.status(200).json({ message: "Reset Password through your email" });
  } else {
    res.status(400).json({ message: "email not found" });
    throw new Error("email not found");
  }
});

//reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const updated = await User.findByIdAndUpdate(req.user._id, {
    password: hash,
  });

  if (updated) {
    res.status(200).json({ message: "Password updated successfullly" });
  } else {
    res.status(400).json({ message: "Failed to reset password" });
    throw new Error("Failed to reset password");
  }
});
module.exports = {
  registerUser,
  verifyUser,
  loginUser,
  logoutUser,
  forgetPassword,
  resetPassword,
};
