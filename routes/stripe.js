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
  onboardStripeAccount,
  getSubscriptions,
  getBalance,
  cancelSubscription,
} = require("../controllers/stripe");

const router = express.Router();

router.post("/checkout", authorizeUser, checkout);
router.post("/create-package", createPackage);
router.post("/subscibe-package", subscribePackage);
router.get("/packages/:userId", getPackages);
router.post("/onboard", onboardStripeAccount);
router.post("/subscription/cancel", cancelSubscription);
router.get("/subscriptions", authorizeUser, getSubscriptions);
router.get("/balance/:userId", getBalance);
router.delete("/delete-package/:packageId", deletePackage);

module.exports = router;
