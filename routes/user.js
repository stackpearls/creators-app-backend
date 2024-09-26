const express = require("express");
const { authorizeUser } = require("../middlewares/authorization");
const {
  getUsers,
  deleteUser,
  updateUser,
  getFollowingUsers,
} = require("../controllers/user");
const upload = require("../middlewares/fileupload");
const router = express.Router();

router.get("/", authorizeUser, getUsers);
router.get("/following", authorizeUser, getFollowingUsers);

router.delete("/delete", authorizeUser, deleteUser);
router.patch(
  "/update",
  authorizeUser,
  upload.fields([
    { name: "profile", maxCount: 1 },
    { name: "cover_image", maxCount: 1 },
  ]),
  updateUser
);

module.exports = router;
