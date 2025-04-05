const express = require("express");
const { authorizeUser } = require("../middlewares/authorization");
const {
  getUsers,
  deleteUser,
  updateUser,
  getFollowingUsers,
  searchUsers,
  getSingleUser,
    requestForCreator,
    creatorVerificationApproved
} = require("../controllers/user");
const upload = require("../middlewares/fileupload");
const router = express.Router();

router.get("/", authorizeUser, getUsers);
router.get("/getSingleUser/:userId", authorizeUser, getSingleUser);
router.get("/following", authorizeUser, getFollowingUsers);
router.get("/search", authorizeUser, searchUsers);

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

router.patch("/requestForCreator/:id", authorizeUser, upload.fields([
    { name: 'file1', maxCount: 1 },
    { name: 'file2', maxCount: 1 },
    { name: 'file3', maxCount: 1 },
    { name: 'file4', maxCount: 1 }
]), requestForCreator);

router.get("/creatorVerificationApproved/:verificationToken/:status", creatorVerificationApproved)

module.exports = router;
