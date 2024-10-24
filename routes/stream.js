const express = require("express");
const { getStreams } = require("../controllers/stream");
const { authorizeUser } = require("../middlewares/authorization");

const router = express.Router();

router.get("/", authorizeUser, getStreams);

module.exports = router;
