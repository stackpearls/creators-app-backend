const express = require("express");
const {
  getAllPosts,
  createPost,
  deletePost,
  getSinglePost,
} = require("../controllers/post");
const { authorizeUser } = require("../middlewares/authorization");
const upload = require("../middlewares/fileupload");
const router = express.Router();

router.post("/create", authorizeUser, upload.array("files", 10), createPost);
router.get("/:following", authorizeUser, getAllPosts);
router.delete("/delete/:postId", authorizeUser, deletePost);
router.get("/:postId", authorizeUser, getSinglePost);

module.exports = router;
