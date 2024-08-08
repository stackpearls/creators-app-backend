const express = require("express");
const { authorizeUser } = require("../middlewares/authorization");
const { sendMessage, getAllMessages } = require("../controllers/message");
const router = express.Router();

router.post("/send", authorizeUser, sendMessage);
router.get("/get/:conversationId", authorizeUser, getAllMessages);

module.exports = router;
