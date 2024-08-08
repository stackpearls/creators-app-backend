const express = require("express");
const { getAllPosts, createPost } = require("../controllers/post");
const { authorizeUser } = require("../middlewares/authorization");
const upload = require("../middlewares/fileupload");
const router = express.Router();

router.post("/create", authorizeUser, upload.array("files", 10), createPost);
router.get("/", authorizeUser, getAllPosts);

module.exports = router;
