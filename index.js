require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "UPI Scam Containment Backend Running" });
});

// 🔑 CREATE ORDER
app.post("/create-order", async (req, res) => {
  try {
    const { amount, currency, note, riskScore } = req.body;

    const options = {
      amount: amount, // in paise
      currency: currency || "INR",
      receipt: "rcpt_" + Date.now(),
      notes: {
        purpose: note || "UPI Payment",
        riskScore: riskScore || 0
      }
    };

    const order = await razorpay.orders.create(options);

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

// 🔐 VERIFY PAYMENT
app.post("/verify-payment", (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.json({ status: "PAYMENT VERIFIED" });
  } else {
    res.status(400).json({ status: "INVALID SIGNATURE" });
  }
});

// Start server
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
