const express = require("express");
const { authorizeUser } = require("../middlewares/authorization");
const { getNotifications } = require("../controllers/notification");
const router = express.Router();

router.get("/:userId", authorizeUser, getNotifications);

module.exports = router;
