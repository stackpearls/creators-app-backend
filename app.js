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
const { ExpressPeerServer } = require("peer");

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
});

// PeerJS setup
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: "/peerjs",
});
app.use(peerServer);

// Use CORS
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  })
);

// Middlewares
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

// Route imports
const authRouter = require("./routes/authentication");
const postRouter = require("./routes/post");
const notificationRouter = require("./routes/notification");
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
app.use("/notification", notificationRouter);

app.get("/test", (req, res) => {
  res.status(200).json({ message: "Server working fine" });
});
// Initial socket connection
handleSocketConnection(io);

// MongoDB connection and server setup
const port = process.env.PORT || 4000;
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => {
    console.log("MongoDB connected successfully");

    server.listen(port, "0.0.0.0", () => {
      console.log(`Server running on port ${port}`);
    });
  })
  .catch((err) => {
    console.log("MongoDB connection error", err);
  });
