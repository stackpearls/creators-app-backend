const asyncHandler = require("express-async-handler");
const Notification = require("../models/notification");

const getNotifications = asyncHandler(async (req, res) => {
  const notification = await Notification.find({
    userId: req.params.userId,
  }).sort({ timestamp: -1 });

  res.status(200).json({ notification: notification });
});

const readNotification = asyncHandler(async (req, res) => {
  await Notification.findByIdAndUpdate(req.params.notificationId, {
    read: true,
  });
  res.status(200).json({ message: "status updated" });
});

module.exports = { getNotifications, readNotification };
