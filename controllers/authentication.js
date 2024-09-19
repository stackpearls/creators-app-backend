const User = require("../models/user");
const asyncHandler = require("express-async-handler");
const generateToken = require("../configurations/generateToken");
const sendEmail = require("../configurations/sendEmail");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const FacebookStrategy = require("passport-facebook").Strategy;
const GoogleStrategy = require("passport-google-oauth2").Strategy;
//register
const registerUser = asyncHandler(async (req, res) => {
  const { name, username, email, password, role, gender, age } = req.body;

  if (!name || !username || !email || !password || !role || !gender || !age) {
    res.status(400).json({ message: "Fields are not defined correctly" });
    return;
  }

  const userAlreadyExists = await User.findOne({ email });

  if (userAlreadyExists) {
    res.status(400).json({ message: "Email is already registered" });
    return;
  }

  const newUser = new User({
    name,
    username,
    email,
    password,
    role,
    gender,
    age,
  });
  await newUser.save();

  const token = generateToken(newUser._id, newUser.role, "2h");
  if (newUser) {
    const url = `${process.env.FRONTEND_URL}/verify/${newUser.id}/${token}`;
    await sendEmail(email, "Fanvue Verification", url);
    res.status(200).json({
      newUser,
      url,
    });
  } else {
    res.status(400).json({ message: "Failed to register user" });
    return;
  }
});

//verify
const verifyUser = asyncHandler(async (req, res) => {
  const user = await User.find({ _id: req.params.id });

  if (!user) {
    return res.status(400).send({ message: "Invalid link" });
  }

  try {
    var userDecoded = jwt.verify(req.params.token, process.env.SECRET_KEY);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).send({ message: "Token has expired" });
    }
  }

  if (req.params.id !== userDecoded.id)
    return res.status(400).send({ message: "Invalid link" });
  const response = await User.findByIdAndUpdate(userDecoded.id, {
    verified: true,
  });
  res.status(200).send({ response, message: "Email verified successfully" });
});

//login
const loginUser = asyncHandler(async (req, res) => {
  const { userId, email, password } = req.body;

  if (userId) {
    const user = await User.findById(userId);
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
      username: user.username,
      profile: user.profile,
      coverImage: user.coverImage,
      age: user.age,
      gender: user.gender,
      role: user.role,
      following: user.following,
      token: generateToken(user._id, user.role, "2h"),
      bio: user.bio,
      location: user.location,
      createdAt:
        user.createdAt.getDate() +
        "-" +
        user.createdAt.getMonth() +
        "-" +
        user.createdAt.getFullYear(),
    });
    return;
  } else {
    const user = await User.findOne({ email });

    if (user && !user.verified) {
      res
        .status(400)
        .json({ message: "User is not verified please verify via email" });
      return;
    } else if (user && user.verified) {
      const passwordMatched = await bcrypt.compare(password, user.password);

      if (passwordMatched) {
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
          username: user.username,
          profile: user.profile,
          coverImage: user.coverImage,
          age: user.age,
          location: user.location,
          gender: user.gender,
          role: user.role,
          following: user.following,
          token: generateToken(user._id, user.role, "2h"),
          createdAt: user.createdAt,
        });
      } else {
        res.status(400).json({ message: "Please check your credentials" });

        return;
      }
    } else {
      res.status(404).json({ message: "No such user found" });
      return;
    }
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
    const token = generateToken(user._id, user.role, "5m");
    const url = `${process.env.FRONTEND_URL}/resetpassword/${token}`;
    await sendEmail(email, "Reset Password", url);
    res.status(200).json({ message: "Reset Password through your email" });
    return;
  } else {
    res.status(400).json({ message: "email not found" });
    return;
  }
});

//reset Password
const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    res.status(400).json({ message: "Please provide complete data" });
    return;
  }
  try {
    var userDecoded = jwt.verify(token, process.env.SECRET_KEY);
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(400).send({ message: "Token has expired" });
    }
  }

  const user = await User.findById(userDecoded.id);
  if (!user) {
    res.status(404).json({ message: "Please provide valid token" });
    return;
  }

  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(password, salt);

  const updated = await User.findByIdAndUpdate(userDecoded.id, {
    password: hash,
  });

  if (updated) {
    res.status(200).json({ message: "Password updated successfullly" });
  } else {
    res.status(400).json({ message: "Failed to reset password" });
    throw new Error("Failed to reset password");
  }
});

const loginFailed = asyncHandler(async (req, res) => {
  res.status(401).json({ message: "Failed logging in" });
});

//login/signup with facebook
passport.use(
  new FacebookStrategy(
    {
      clientID: process.env.FACEBOOK_APP_ID,
      clientSecret: process.env.FACEBOOK_APP_SECRET,
      callbackURL: `${process.env.FRONTEND_URL}/auth/facebook/callback`,
      profileFields: ["id", "displayName", "emails"],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ facebook_id: profile.id });

        if (user) {
          return done(null, user);
        } else {
          user = await User.findOne({
            email: profile.emails ? profile.emails[0].value : null,
          });

          if (user && !user.facebook_id) {
            user.facebook_id = profile.id;
            await user.save();
            return done(null, user);
          } else {
            const timestamp = Date.now().toString().slice(-3);
            const randomNum = Math.floor(10 + Math.random() * 90);

            const username = (
              (profile.displayName
                ? profile.displayName.split(" ").join("").slice(0, 5) // Limit displayName to 5 characters
                : "user") +
              profile.id.slice(0, 2) +
              timestamp +
              randomNum
            ).slice(0, 12);
            const password = Math.random().toString(36).substring(2, 15);

            const newUser = new User({
              facebook_id: profile.id,
              name: profile.displayName,
              email: profile.emails ? profile.emails[0].value : null,
              username,
              password,
              verified: true,
            });

            await newUser.save();

            return done(null, newUser);
          }
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

//login/signup with google
passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.BASE_URL}:${process.env.PORT}/auth/google/callback`,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ google_id: profile.id });

        if (user) {
          return done(null, user);
        } else {
          user = await User.findOne({
            email: profile.emails ? profile.emails[0].value : null,
          });

          if (user && !user.google_id) {
            user.google_id = profile.id;
            await user.save();
            return done(null, user);
          } else {
            const timestamp = Date.now().toString().slice(-3); // Last 3 digits of timestamp
            const randomNum = Math.floor(10 + Math.random() * 90); // 2-digit random number

            // Limit displayName to 5 characters, similar to Facebook logic
            const username = (
              (profile.displayName
                ? profile.displayName.split(" ").join("").slice(0, 5) // First 5 characters of display name
                : "user") +
              profile.id.slice(0, 2) + // First 2 characters of the Google profile ID
              timestamp + // Last 3 digits of the current timestamp
              randomNum
            ) // Random 2-digit number
              .slice(0, 12); // Limit the username to 12 characters

            const password = Math.random().toString(36).substring(2, 15); // Random password

            const newUser = new User({
              google_id: profile.id,
              name: profile.displayName || "User", // Use displayName or fallback
              email: profile.emails ? profile.emails[0].value : null,
              username, // Generated username
              password, // Randomly generated password
              verified: true,
            });

            await newUser.save();

            return done(null, newUser);
          }
        }
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
module.exports = {
  registerUser,
  verifyUser,
  loginUser,
  logoutUser,
  forgetPassword,
  resetPassword,
  loginFailed,
};
