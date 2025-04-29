const asyncHandler = require("express-async-handler");
const Package = require("../models/packages");
const Subscription = require("../models/subscription");
require("dotenv").config();
const endpointSecret = process.env.WEBHOOK_SECRET;
const Stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const fetechWebhook = asyncHandler(async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Construct the event using the raw body and signature
    event = Stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the `checkout.session.completed` event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      // Get package details
      const package = await Package.findOne({
        priceId: session.metadata.priceId,
      });
      if (!package) {
        throw new Error("Package not found");
      }

      // Save the subscription to the database
      const newSubscription = new Subscription({
        buyerId: session.metadata.buyerId,
        creatorId: package.userId,
        priceId: session.metadata.priceId,
        subscriptionId: session.subscription,
        status: "active",
      });

      await newSubscription.save();
    } catch (error) {
      console.error("Error saving subscription:", error.message);
    }
  }

  if (
    event.type === "customer.subscription.deleted" ||
    event.type === "customer.subscription.updated"
  ) {
    const subscription = event.data.object;

    try {
      // Check if subscription status is "canceled" or "expired"
      if (
        ["canceled", "incomplete_expired", "unpaid"].includes(
          subscription.status
        )
      ) {
        // Find the corresponding subscription in the database
        const dbSubscription = await Subscription.findOne({
          subscriptionId: subscription.id,
        });

        if (dbSubscription) {
          // Update the subscription status in the database to "canceled"
          dbSubscription.status = "canceled";
          await dbSubscription.save();
        }
      }
    } catch (error) {
      console.error("Error handling subscription update:", error.message);
    }
  }

  res.json({ received: true });
});

module.exports = fetechWebhook;
