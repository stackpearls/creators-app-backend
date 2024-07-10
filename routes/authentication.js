const express = require("express");
const router = express.Router();
const {
  registerUser,
  verifyUser,
  loginUser,
  logoutUser,
  forgetPassword,
  resetPassword,
} = require("../controllers/authentication");
const { authorizeUser } = require("../middlewares/authorization");

router.post("/register", registerUser);
router.patch("/verify/:id/:token", verifyUser);
router.post("/login", loginUser);
router.post("/logout", logoutUser);
router.post("/forgetpassword/:token", forgetPassword);
router.patch("/password/reset", authorizeUser, resetPassword);

module.exports = router;
