const asyncHandler = require("express-async-handler");
const Converstation = require("../models/converstation");
const Message = require("../models/message");

//send message
const sendMessage = asyncHandler(async (req, res) => {
  const { message, conversationId } = req.body;

  if (!conversationId || !message) {
    return res.status(400).json({ message: "Bad request" });
  }

  const conversation = await Converstation.find({
    conversationId,
  });

  if (!conversation) {
    return res.status(404).json({ message: "No such converation id  found" });
  }

  const newMessage = new Message({
    message,
    conversationId,
    sender: req.user._id,
  });

  await newMessage.save();

  if (!newMessage) {
    return res.status(400).json({ message: "Failed to send message" });
  }
  res.status(200).json({ message: newMessage });
});

//get all messages
const getAllMessages = asyncHandler(async (req, res) => {
  const conversationId = req.params.conversationId;

  const messages = await Message.find({ conversationId }).sort({
    createdAt: 1,
  });

  if (!messages || messages.length === 0) {
    return res
      .status(404)
      .json({ message: "No messages found in this conversation" });
  }

  res.status(200).json({ messages });
});

module.exports = { sendMessage, getAllMessages };
