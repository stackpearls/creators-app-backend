const express = require("express");
const { authorizeUser } = require("../middlewares/authorization");
const {
  getNotifications,
  readNotification,
} = require("../controllers/notification");
const router = express.Router();

router.get("/:userId", authorizeUser, getNotifications);
router.put("/:notificationId/read", authorizeUser, readNotification);

module.exports = router;
