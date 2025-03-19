const express = require("express");
const bodyParser = require("body-parser");
const { authorizeUser } = require("../middlewares/authorization");
const {
  checkout,
  createPackage,
  subscribePackage,
  fetechWebhook,
  getPackages,
  deletePackage,
} = require("../controllers/stripe");

const router = express.Router();

router.post("/checkout", authorizeUser, checkout);
router.post("/create-package", createPackage);
router.post("/subscibe-package", subscribePackage);
router.get("/packages/:userId", getPackages);
router.delete("/delete-package/:packageId", deletePackage);

module.exports = router;
