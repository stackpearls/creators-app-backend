const express = require("express");
const { authorizeUser } = require("../middlewares/authorization");
const { addLike, deleteLike } = require("../controllers/like");
const router = express.Router();

router.post("/add", authorizeUser, addLike);
router.post("/delete", authorizeUser, deleteLike);
module.exports = router;
