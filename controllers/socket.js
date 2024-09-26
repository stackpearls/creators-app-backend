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

const activeStreams = {};
const activeUsers = {};

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

    // Handle offer from broadcaster
    socket.on("offer", (data) => {
      const { offer, broadcasterId } = data;

      activeStreams[broadcasterId] = {
        offer,
        streamerSocketId: socket.id,
        broadcasterId: broadcasterId,
      };

      io.emit("streams-available", activeStreams);
      console.log(`Offer stored for broadcaster: ${broadcasterId}`);
    });

    // When a viewer wants to watch a stream
    socket.on("watch-stream", (broadcasterId) => {
      if (activeStreams[broadcasterId]) {
        const { offer, streamerSocketId } = activeStreams[broadcasterId];
        socket.join(broadcasterId);
        socket.emit("offer", { offer, broadcasterId: streamerSocketId });
        console.log(
          `Offer sent to viewer: ${socket.id} for broadcaster: ${broadcasterId}`
        );
      } else {
        socket.emit("stream-not-found", { message: "Stream not available" });
      }
    });

    // When viewer sends an answer to the broadcaster
    socket.on("answer", (data) => {
      const { answer, broadcasterId } = data;
      socket.to(broadcasterId).emit("answer", { answer, viewerId: socket.id });
      console.log(`Answer sent to broadcaster: ${broadcasterId}`);
    });

    // Handle ICE candidates
    socket.on("ice-candidate", (data) => {
      const { candidate, targetId } = data;
      if (targetId) {
        socket.to(targetId).emit("ice-candidate", candidate);
        console.log(`ICE candidate sent to: ${targetId}`);
      } else {
        console.error("ICE candidate target ID is missing or undefined");
      }
    });

    socket.on("disconnect", async () => {
      await removeUser(socket.id);

      // Find the userId associated with the disconnected socket
      const userId = Object.keys(activeUsers).find(
        (key) => activeUsers[key].socketId === socket.id
      );

      if (userId) {
        // Remove the user from the activeUsers object
        delete activeUsers[userId];
        console.log(`User disconnected: ${userId}`);

        // Emit the updated active users list
        io.emit("active-users", Object.values(activeUsers));
      }
    });
  });
};

module.exports = { addUser, removeUser, getUser, handleSocketConnection };
