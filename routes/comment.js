const express = require("express");
const router = express.Router();
const { authorizeUser } = require("../middlewares/authorization");
const {
  addComment,
  updateComment,
  deleteComment,
} = require("../controllers/comment");

router.post("/add", authorizeUser, addComment);
router.patch("/update/:id", authorizeUser, updateComment);
router.delete("/delete/:id", authorizeUser, deleteComment);
module.exports = router;
