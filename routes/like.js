const express = require("express");
const { authorizeUser } = require("../middlewares/authorization");
const { addLike, deleteLike } = require("../controllers/like");
const router = express.Router();

router.post("/add", authorizeUser, addLike);
router.delete("/delete/:id", authorizeUser, deleteLike);
module.exports = router;
