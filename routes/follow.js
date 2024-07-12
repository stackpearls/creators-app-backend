const express = require("express");
const router = express.Router();
const { authorizeUser } = require("../middlewares/authorization");
const { followUnfollowUser } = require("../controllers/follow");

router.patch("/", authorizeUser, followUnfollowUser);

module.exports = router;
