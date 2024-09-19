const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const session = require("express-session");
const passport = require("passport");
const path = require("path");
const { Server } = require("socket.io");
const http = require("http");
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://93.127.215.61",
    credentials: true,
  },
});

app.use(
  cors({
    origin: "http://93.127.215.61",
    credentials: true,
  })
);

//middlewares
app.use(express.json());
app.use(cookieParser());
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));
app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: true,
    saveUninitialized: true,
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
const userRouter = require("./routes/user");
const conversationRouter = require("./routes/conversation");
const messageRouter = require("./routes/message");
const { handleSocketConnection } = require("./controllers/socket");

app.use("/", authRouter);
app.use("/posts", postRouter);
app.use("/follow", followRouter);
app.use("/comment", commentRouter);
app.use("/like", likeRouter);
app.use("/user", userRouter);
app.use("/conversation", conversationRouter);
app.use("/message", messageRouter);

//initial socket connection
handleSocketConnection(io);
//initial connection
const port = process.env.PORT || 4000;
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("mongod db connected successfully");

    server.listen(port, () => {
      console.log(`Server connected successfully on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("connection error", err);
  });
