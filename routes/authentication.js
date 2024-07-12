const express = require("express");
const router = express.Router();
const passport = require("passport");
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
router.get("/login/facebook", passport.authenticate("facebook"));
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { failureRedirect: "/login" }),
  (req, res) => {
    console.log("success");
    res.redirect("/somewhere"); // Example redirect after successful login
  }
);
router.post("/logout", logoutUser);
router.post("/forgetpassword/:token", forgetPassword);
router.patch("/password/reset", authorizeUser, resetPassword);

module.exports = router;
