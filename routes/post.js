const express = require("express");
const { getAllPosts, createPost } = require("../controllers/post");
const { authorizeUser } = require("../middlewares/authorization");
const router = express.Router();

router.post("/create", authorizeUser, createPost);
router.post("/", authorizeUser, getAllPosts);

module.exports = router;
