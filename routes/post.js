const express = require("express");
const {
  getAllPosts,
  createPost,
  deletePost,
  getSinglePost,
  getSingleUserPostsWithSubscription,
} = require("../controllers/post");
const { authorizeUser } = require("../middlewares/authorization");
const upload = require("../middlewares/fileupload");
const router = express.Router();

router.post("/create", authorizeUser, upload.array("files", 10), createPost);
router.get("/:following", authorizeUser, getAllPosts);
router.get(
  "/getIndividualPosts/:userId",
  authorizeUser,
  getSingleUserPostsWithSubscription
);
router.delete("/delete/:postId", authorizeUser, deletePost);
router.get("/getSinglePost/:postId", authorizeUser, getSinglePost);

module.exports = router;
