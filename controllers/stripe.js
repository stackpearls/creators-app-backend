const asyncHandler = require("express-async-handler");
const Package = require("../models/packages");
const Subscription = require("../models/subscription");
const User = require("../models/user");
const { default: mongoose } = require("mongoose");
require("dotenv").config();
const Stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const checkout = asyncHandler(async (req, res) => {
  const { priceId } = req.body;

  const creator = await User.findOne({ priceID: priceId });
  if (!creator) {
    return res.status(404).json({
      message: "No Such User Found",
    });
  }

  const isSubscribed = await Subscription.findOne({
    buyerId: req.user._id,
    creatorId: creator._id,
  });

  if (isSubscribed) {
    return res.status(409).json({
      message: "You are already subscribed to this creator!",
    });
  }
  try {
    const session = await Stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/dashboard/status?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard/status?status=failure`,
      metadata: {
        buyerId: req.user.id,
        priceId,
      },
      subscription_data: {
        transfer_data: {
          destination: creator.stripeAccountId,
        },
        application_fee_percent: 8,
      },
    });

    res.status(200).json({ url: session.url });
  } catch (error) {
    console.error("Error creating checkout session:", error);
    res.status(500).json({ error: error.message });
  }
});

const createPackage = asyncHandler(async (req, res) => {
  const { userId, packageName, description, priceAmount, currency } = req.body;

  try {
    const product = await Stripe.products.create({
      name: packageName,
      description,
      metadata: { creatorId: userId },
    });

    const price = await Stripe.prices.create({
      unit_amount: priceAmount * 100,
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
    if (!user.stripeAccountId) {
      return res.status(400).json({
        error:
          "User has not connected their Stripe account. Please complete onboarding.",
      });
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
    const package = await Package.findOne({ priceId });
    if (!package) {
      return res.status(404).json({ message: "Package not found" });
    }

    const user = await User.findById(buyerId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await Stripe.customers.create({
        metadata: { buyerId },
        email: user.email,
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const subscription = await Stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      expand: ["latest_invoice.payment_intent"],
    });

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

const onboardStripeAccount = asyncHandler(async (req, res) => {
  const { userId } = req.body;

  const user = await User.findById(userId);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let stripeAccountId = user.stripeAccountId;
  if (!stripeAccountId) {
    const account = await Stripe.accounts.create({
      type: "express",
      country: "US",
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: {
        userId: user._id.toString(),
      },
    });

    user.stripeAccountId = account.id;
    await user.save();

    stripeAccountId = account.id;
  }

  const accountLink = await Stripe.accountLinks.create({
    account: stripeAccountId,
    refresh_url: `${process.env.FRONTEND_URL}/dashboard/package?status=failure`,
    return_url: `${process.env.FRONTEND_URL}/dashboard/package?status=success`,
    type: "account_onboarding",
  });

  res.status(200).json({ onboardingUrl: accountLink.url });
});

const getBalance = asyncHandler(async (req, res) => {
  const userId = req.params.userId;

  const user = await User.findById(userId);

  if (!user || !user.stripeAccountId) {
    return res.status(404).json({ message: "No such user found" });
  }

  try {
    const balance = await Stripe.balance.retrieve({
      stripeAccount: user.stripeAccountId,
    });

    res.status(200).json({
      balance,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

const getSubscriptions = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        message: "No such user found",
      });
    }

    const subscriptions = await Subscription.aggregate([
      {
        $match: {
          buyerId: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "creatorId",
          foreignField: "_id",
          as: "creator",
        },
      },
      {
        $unwind: "$creator",
      },

      {
        $project: {
          _id: 1,
          buyerId: 1,
          creatorId: 1,
          createdAt: 1,
          status: 1,
          subscriptionId: 1,
          "creator.name": 1,
          "creator.username": 1,
        },
      },
    ]);

    return res.status(200).json(subscriptions);
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});

const cancelSubscription = asyncHandler(async (req, res) => {
  const { subscriptionId } = req.body;
  try {
    const subscription = await Subscription.findOne({
      subscriptionId,
    });
    if (!subscription) {
      return res.status(404).json({ message: "Subscription not found" });
    }

    if (subscription.subscriptionEndDate) {
      return res
        .status(400)
        .json({ message: "Error", endDate: subscription.subscriptionEndDate });
    }

    const cancelSubscription = await Stripe.subscriptions.update(
      subscription.subscriptionId,
      {
        cancel_at_period_end: true,
      }
    );
    const cancelAtUnix = cancelSubscription.cancel_at;
    const cancelAtDate = new Date(cancelAtUnix * 1000);

    subscription.subscriptionEndDate = cancelAtDate;
    await subscription.save();
    return res.status(200).json({
      message: "Subscription cancellation scheduled successfully",
      subscription: cancelSubscription,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
});
module.exports = {
  checkout,
  createPackage,
  subscribePackage,
  getPackages,
  deletePackage,
  onboardStripeAccount,
  getBalance,
  getSubscriptions,
  cancelSubscription,
};
