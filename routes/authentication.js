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
  loginFailed,
} = require("../controllers/authentication");
const { authorizeUser } = require("../middlewares/authorization");

router.post("/register", registerUser);
router.get("/verify/:id/:token", verifyUser);
router.post("/login", loginUser);

router.get(
  "/auth/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/auth/google",
  passport.authenticate("google", { scope: ["email", "profile"] })
);

// Facebook callback URL
router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: "/login/failed",
  }),
  (req, res) => {
    const userId = req.user.id;
    console.log("1");
    res.redirect(`http://localhost:4200/login?userId=${userId}`);
  }
);

//google callback url
router.get(
  "/auth/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login/failed",
  }),
  (req, res) => {
    const userId = req.user.id;
    res.redirect(`http://localhost:4200/login?userId=${userId}`);
  }
);

router.get("/login/failed", loginFailed);

router.post("/logout", logoutUser);
router.post("/forgetpassword", forgetPassword);
router.patch("/password/reset", resetPassword);

module.exports = router;
