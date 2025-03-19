const Socket = require("../models/socket");
const asyncHandler = require("express-async-handler");
const Notification = require("../models/notification");
const Stream = require("../models/stream");
const User = require("../models/user");
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

const addStream = asyncHandler(async (streamData) => {
  const stream = new Stream({
    channel: streamData.channel,
    userId: streamData.creator._id,
  });
  await stream.save();
});

const deleteStream = asyncHandler(async (stream) => {
  await Stream.findOneAndDelete({ channel: stream.channelName });
});
const activeUsers = {};
let activeStreams = [];

async function activateUser(userId) {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { active: true },
      { new: true }
    );
    console.log("User activated:");
  } catch (error) {
    console.error("Error activating user:", error);
  }
}

async function deactivateUser(userId) {
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { active: false },
      { new: true }
    );
    console.log("User deactivate:");
  } catch (error) {
    console.error("Error activating user:", error);
  }
}
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

      activateUser(data.userId);

      io.emit("user-activated", data.userId);
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
      console.log("Post liked socket");

      const { userId, likedBy, contentId, mediaUrl } = data;

      // Create the notification object
      const notification = new Notification({
        userId, // This is the user receiving the notification (post owner)
        type: "like",
        contentId: contentId,
        message: `${likedBy} liked your post`,
        mediaUrl: mediaUrl, // Add mediaUrl to the notification data
      });

      // Save the notification to the database
      await notification.save();

      // Get the socket ID of the user who owns the post
      const receiver = await getUser(userId); // Fetch the user who owns the post

      if (receiver) {
        // Emit the notification to the specific user
        io.to(receiver.socketId).emit("notification", notification);
        console.log(`Notification sent to user ${userId}`);
      } else {
        console.log("Receiver not found for notification");
      }
    });

    socket.on("post-comment", async (data) => {
      console.log("Post comment socket");

      const { userId, commentBy, contentId, mediaUrl } = data;

      // Create the notification object
      const notification = new Notification({
        userId, // This is the user receiving the notification (post owner)
        type: "comment",
        contentId: contentId,
        message: `${commentBy} left a comment on your post `,
        mediaUrl: mediaUrl, // Add mediaUrl to the notification data
      });

      // Save the notification to the database
      await notification.save();

      // Get the socket ID of the user who owns the post
      const receiver = await getUser(userId); // Fetch the user who owns the post

      if (receiver) {
        // Emit the notification to the specific user
        io.to(receiver.socketId).emit("notification", notification);
        console.log(`Notification sent to user ${userId}`);
      } else {
        console.log("Receiver not found for notification");
      }
    });
    //comment post
    // socket.on("post-comment", async (data) => {
    //   console.log(data);
    //   const { userId, commentBy, contentId } = data;
    //   const notification = new Notification({
    //     userId,
    //     type: "comment",
    //     contentId: contentId,
    //     message: `${commentBy} left a comment on your post `,
    //   });
    //   await notification.save();

    //   io.to(userId).emit("notification", notification);
    // });
    //stream start
    socket.on("stream-start", (streamData) => {
      activeStreams.push(streamData);
      addStream(streamData);
      // io.emit("active-streams", activeStreams);
      socket.broadcast.emit("stream-started", streamData);

      console.log("stream emitted: ", activeStreams);
    });
    //stream end
    socket.on("stream-end", (data) => {
      console.log(data, ":Data");
      activeStreams = activeStreams.filter(
        (stream) => stream.channel !== data.channelName
      );
      deleteStream(data);
      socket.broadcast.emit("stream-ended", data);
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
      deactivateUser(userId);
      if (userId) {
        delete activeUsers[userId];
        console.log(`User disconnected: ${userId}`);

        io.emit("user-deactivated", userId);
      }
    });
  });
};

module.exports = { addUser, removeUser, getUser, handleSocketConnection };
