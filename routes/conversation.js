const express = require("express");
const router = express.Router();
const { authorizeUser } = require("../middlewares/authorization");
const {
  createOrAccessConversation,
  getAllConversations,
  getParticularConversation,
} = require("../controllers/conversation");

router.get("/all", authorizeUser, getAllConversations);
router.get("/:receiverId", authorizeUser, getParticularConversation);
router.post("/", authorizeUser, createOrAccessConversation);

module.exports = router;
