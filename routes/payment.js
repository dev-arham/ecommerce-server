const express = require('express');
const asyncHandler = require('express-async-handler');
const router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

// for stripe payment gateway
const stripe = require('stripe')(process.env.STRIPE_SKRT_KET_TST);

router.post('/stripe', asyncHandler(async (req, res) => {
  try {
    const { email, name, address, amount, currency, description } = req.body;

    const customer = await stripe.customers.create({
      email: email,
      name: name,
      address: address,
    });

    const ephemeralKey = await stripe.ephemeralKeys.create(
      { customer: customer.id },
      { apiVersion: '2023-10-16' }
    );

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: currency,
      customer: customer.id,
      description: description,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.json({
      paymentIntent: paymentIntent.client_secret,
      ephemeralKey: ephemeralKey.secret,
      customer: customer.id,
      publishableKey: process.env.STRIPE_PBLK_KET_TST,
    });

  } catch (error) {
    return res.json({ error: true, message: error.message, data: null });
  }
}));





router.post('/razorpay', asyncHandler(async (req, res) => {
  try {
    const razorpayKey  = process.env.RAZORPAY_KEY_TEST
    res.json({  key: razorpayKey });
  } catch (error) {
    res.status(500).json({ error: true, message: error.message, data: null });
  }
}));





module.exports = router;