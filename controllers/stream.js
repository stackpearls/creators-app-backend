const asyncHandler = require("express-async-handler");
const Stream = require("../models/stream");

const getStreams = asyncHandler(async (req, res) => {
  const streams = await Stream.find().populate(
    "userId",
    "username name profile"
  );
  if (!streams) {
    return res.status(404).json({ "message: ": "No Stream Found" });
  }

  const formattedStreams = streams.map((stream) => ({
    _id: stream._id,
    channel: stream.channel,
    creator: stream.userId, // Rename userId to userData
  }));
  return res.status(200).json({ formattedStreams });
});

module.exports = { getStreams };
