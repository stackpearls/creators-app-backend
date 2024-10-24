const asyncHandler = require("express-async-handler");
const Conversation = require("../models/converstation");
const message = require("../models/message");
const converstation = require("../models/converstation");

//all conversations
const getAllConversations = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;

  const conversations = await Conversation.find({
    members: { $in: [userId] },
  }).populate("members", "name _id profile username active");
  if (conversations) {
    res.status(200).json({ conversations });
  } else {
    return res.status(400).json({ message: "Bad request" });
  }
});

//chat with particular member
const getParticularConversation = asyncHandler(async (req, res) => {
  const { _id: userId } = req.user;
  const receiverId = req.params.receiverId;

  const conversations = await Conversation.find({
    members: { $all: [userId, receiverId] },
  });

  if (!conversations) {
    return res.status(404).json({ message: "No such conversation found" });
  }
  res.status(200).json({ conversations: conversations });
});

//create or access conversation
const createOrAccessConversation = asyncHandler(async (req, res) => {
  const { _id: senderId } = req.user;
  const { receiverId } = req.body;

  if (!receiverId) {
    return res.status(400).json({ message: "Please send complete details" });
  }
  const conversationFound = await Conversation.find({
    $and: [
      { members: { $elemMatch: { $eq: senderId } } },
      {
        members: { $elemMatch: { $eq: receiverId } },
      },
    ],
  }).populate("members", "-password");

  if (conversationFound.length > 0) {
    const conversationId = conversationFound[0]._id;

    const messages = await message
      .find({ conversationId })
      .populate("sender", "name _id");

    if (!messages) {
      res.status(404).json({ message: "No messages found" });
    }

    return res
      .status(200)
      .json({ messages: messages, conversationId: conversationId });
  }

  const conversation = new converstation({ members: [senderId, receiverId] });

  await conversation.save();

  if (!conversation) {
    return res.status(400).json({ message: "Bad request" });
  } else if (conversation) {
    res
      .status(200)
      .json({ conversation: conversation, message: "Conversation Created" });
  }
});

module.exports = {
  getAllConversations,
  getParticularConversation,
  createOrAccessConversation,
};
