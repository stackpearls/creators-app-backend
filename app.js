const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const path = require("path");

dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:4200",
    credentials: true,
  })
);

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use(
  "/uploads",
  express.static(path.join(__dirname, "middlewares/uploads"))
);
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: true,
    saveUninitialized: true,
    // cookie: {
    //   httpOnly: true,
    //   secure: false, // Set to true if using HTTPS
    //   sameSite: "lax",
    // },
  })
);
app.use(passport.initialize());
app.use(passport.session());

//route imports
const authRouter = require("./routes/authentication");
const postRouter = require("./routes/post");
const followRouter = require("./routes/follow");
const commentRouter = require("./routes/comment");
const likeRouter = require("./routes/like");

app.use("/", authRouter);
app.use("/posts", postRouter);
app.use("/follow", followRouter);
app.use("/comment", commentRouter);
app.use("/like", likeRouter);
//initial connection

const port = process.env.PORT || 4000;
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("mongod db connected successfully");

    app.listen(port, () => {
      console.log(`Server connected successfully on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("connection error", err);
  });
