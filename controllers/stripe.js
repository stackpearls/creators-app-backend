const asyncHandler = require("express-async-handler");
const Package = require("../models/packages");
const Subscription = require("../models/subscription");
const User = require("../models/user");
require("dotenv").config();
const Stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const checkout = asyncHandler(async (req, res) => {
  const { priceId } = req.body; // Pass priceId and quantity from the frontend.

  try {
    const session = await Stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1, // Default quantity is 1 if not provided.
        },
      ],
      mode: "subscription", // Use "payment" for one-time payments.
      success_url:
        "http://localhost:4200/success?session_id={CHECKOUT_SESSION_ID}",
      cancel_url: "http://localhost:4200/cancel",
      metadata: {
        buyerId: req.user.id,
        priceId,
      },
    });

    res.status(200).json({ url: session.url }); // Return the Stripe Checkout URL.
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

const createPackage = asyncHandler(async (req, res) => {
  const { userId, packageName, description, priceAmount, currency } = req.body;

  try {
    // Create a product for the subscription package
    const product = await Stripe.products.create({
      name: packageName,
      description,
      metadata: { creatorId: userId },
    });

    // Create a price for the product
    const price = await Stripe.prices.create({
      unit_amount: priceAmount * 100, // Convert to cents
      currency,
      recurring: { interval: "month" },
      product: product.id,
    });

    const newPackage = new Package({
      productId: product.id,
      priceId: price.id,
      packageName,
      priceAmount,
      currency,
      userId,
    });

    await newPackage.save();

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.priceID = user.priceID || price.id;
    await user.save();

    res
      .status(200)
      .json({ message: "Package created successfully", newPackage });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const getPackages = asyncHandler(async (req, res) => {
  const userID = req.params.userId;

  try {
    const packages = await Package.find({
      userId: userID,
    });

    res.status(200).json({ package: packages });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const deletePackage = asyncHandler(async (req, res) => {
  const packageId = req.params.packageId;

  try {
    await Package.findOneAndDelete({
      _id: packageId,
    });

    res.status(200).json({ message: "Package Delete Successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const subscribePackage = asyncHandler(async (req, res) => {
  const { buyerId, priceId } = req.body;

  try {
    // Find the package using the priceId
    const package = await Package.findOne({ priceId });
    if (!package) {
      return res.status(404).json({ message: "Package not found" });
    }

    // Create a customer in Stripe
    const customer = await Stripe.customers.create({
      metadata: { buyerId },
    });

    // Create a subscription in Stripe
    const subscription = await Stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      expand: ["latest_invoice.payment_intent"],
    });

    // Save subscription details to the database
    const newSubscription = new Subscription({
      buyerId,
      creatorId: package.userId,
      priceId,
      subscriptionId: subscription.id,
      status: "active",
    });

    await newSubscription.save();

    res.status(200).json({
      message: "Subscription successful",
      subscription: newSubscription,
    });
  } catch (error) {
    console.error("Error subscribing to package:", error);
    res
      .status(500)
      .json({ message: "Subscription failed", error: error.message });
  }
});

module.exports = {
  checkout,
  createPackage,
  subscribePackage,
  getPackages,
  deletePackage,
};
