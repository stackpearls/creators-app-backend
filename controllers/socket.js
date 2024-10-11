const Socket = require("../models/socket");
const asyncHandler = require("express-async-handler");

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
const activeStreams = {};

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
      console.log(`User added: ${data.name} with ID: ${data.userId}`);
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
    socket.on("join-room", ({ roomId, peerId }) => {
      socket.join(roomId);
      console.log(`User ${peerId} joined room ${roomId}`);
      activeStreams[roomId] = { room: roomId, peer: peerId };
      socket.to(roomId).emit("user-connected", peerId);
    });
    socket.on("stream-started", ({ roomId, peerId }) => {
      console.log("Stream is started");
      activeStreams[roomId] = { room: roomId, peer: peerId };
      io.emit("active-streams", Object.values(activeStreams));
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
