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

const handleSocketConnection = (io) => {
  io.on("connection", (socket) => {
    console.log("new user connected", socket.id);
    socket.on("AddUser", (data) => {
      addUser(data.userId, data.name, socket.id);
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

    socket.on("disconnect", async () => {
      await removeUser(socket.id);
    });
  });
};

module.exports = { addUser, removeUser, getUser, handleSocketConnection };
