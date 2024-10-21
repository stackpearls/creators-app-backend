const Socket = require("../models/socket");
const asyncHandler = require("express-async-handler");
const Notification = require("../models/notification");
const addUser = asyncHandler(async (userId, name, socketId) => {
  const socketAlreadExists = await Socket.findOne({ userId });

  if (!socketAlreadExists) {
    const newSocket = new Socket({ userId, name, socketId });
    await newSocket.save();
  } else {
    await Socket.findOneAndUpdate({ userId }, { socketId });
  }
});

const removeUser = asyncHandler(async (socketId) => {
  await Socket.findOneAndDelete({ socketId });
});

const getUser = asyncHandler(async (userId) => {
  return await Socket.findOne({ userId });
});

const activeUsers = {};
let activeStreams = [];

const handleSocketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log("new user connected", socket.id);
    socket.on("AddUser", (data) => {
      addUser(data.userId, data.name, socket.id);
      activeUsers[data.userId] = {
        name: data.name,
        socketId: socket.id,
        _id: data.userId,
      };
      console.log(
        `User added: ${data.name} with ID: ${data.userId}`,
        activeUsers
      );

      io.emit("active-users", Object.values(activeUsers));
    });

    socket.on("sendMessage", async (data) => {
      const receiver = await getUser(data.receiverId);
      if (receiver) {
        io.to(receiver.socketId).emit("getMessage", {
          sender: data.sender,
          conversationId: data.conversationId,
          createdAt: data.createdAt,
          message: data.message,
        });
      }
    });
    //like post
    socket.on("post-liked", async (data) => {
      console.log(data);
      const { userId, likedBy, contentId } = data;
      const notification = new Notification({
        userId,
        type: "like",
        contentId: contentId,
        message: `${likedBy} liked your post `,
      });
      await notification.save();

      io.to(userId).emit("notification", notification);
    });

    //comment post
    socket.on("post-comment", async (data) => {
      console.log(data);
      const { userId, commentBy, contentId } = data;
      const notification = new Notification({
        userId,
        type: "comment",
        contentId: contentId,
        message: `${commentBy} left a comment on your post `,
      });
      await notification.save();

      io.to(userId).emit("notification", notification);
    });
    //stream start
    socket.on("stream-start", (streamData) => {
      activeStreams.push(streamData);
      io.emit("active-streams", activeStreams);
      console.log("stream emitted: ", activeStreams);
    });
    //stream end
    socket.on("stream-end", (data) => {
      console.log(data, ":Data");
      activeStreams = activeStreams.filter(
        (stream) => stream.channel !== data.channelName
      );
      io.emit("active-streams", activeStreams);
      console.log(
        "stream ended: ",
        data.channelName,
        "Active Streams: ",
        activeStreams
      );
    });

    socket.on("disconnect", async () => {
      await removeUser(socket.id);

      const userId = Object.keys(activeUsers).find(
        (key) => activeUsers[key].socketId === socket.id
      );

      if (userId) {
        delete activeUsers[userId];
        console.log(`User disconnected: ${userId}`);

        io.emit("active-users", Object.values(activeUsers));
      }
    });
  });
};

module.exports = { addUser, removeUser, getUser, handleSocketConnection };
