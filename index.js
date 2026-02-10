require("dotenv").config();
console.log("MONGO_URI:", process.env.MONGO_URI);
const express = require("express");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const cors = require("cors");
const mongoose = require("mongoose");

const Transaction = require("./models/Transaction");
const AuditLog = require("./models/AuditLog");
const calculateRisk = require("./utils/riskScore");

const app = express();
app.use(express.json());
app.use(cors());

/* ------------------ DATABASE CONNECTION ------------------ */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));

/* ------------------ RAZORPAY SETUP ------------------ */
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/* ------------------ HEALTH CHECK ------------------ */
app.get("/", (req, res) => {
  res.json({ status: "UPI Scam Containment Backend Running" });
});

/* ------------------ CREATE ORDER + CONTAINMENT ------------------ */
app.post("/create-order", async (req, res) => {
  try {
    const { userId, receiverId, amount } = req.body;

    // Simulated behavior flags (later replace with real logic)
    const isNewReceiver = true;
    const isOddTime = new Date().getHours() < 6;
    const rapidTransfer = false;

    // Calculate risk score
    const riskScore = calculateRisk(
      amount,
      isNewReceiver,
      isOddTime,
      rapidTransfer
    );

    // Decide transaction status
    let status = "COMPLETED";
    if (riskScore >= 70) status = "SOFT_HOLD";

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: amount, // paise
      currency: "INR",
      receipt: "rcpt_" + Date.now(),
      notes: {
        riskScore
      }
    });

    // Store transaction in DB
    const tx = await Transaction.create({
      transactionId: order.id,
      userId,
      receiverId,
      amount,
      riskScore,
      status
    });

    // Audit log
    await AuditLog.create({
      transactionId: tx.transactionId,
      action: `Transaction ${status}`
    });

    res.json({
      message: "Order created",
      transactionId: tx._id,
      razorpayOrderId: order.id,
      riskScore,
      status
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Order creation failed" });
  }
});

/* ------------------ USER CONFIRMS TRANSACTION ------------------ */
app.post("/confirm/:id", async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx || tx.status !== "SOFT_HOLD") {
    return res.status(400).json({ message: "Invalid transaction" });
  }

  tx.status = "COMPLETED";
  await tx.save();

  await AuditLog.create({
    transactionId: tx.transactionId,
    action: "User confirmed transaction"
  });

  res.json({ message: "Transaction completed successfully" });
});

/* ------------------ USER REPORTS FRAUD ------------------ */
app.post("/report-fraud/:id", async (req, res) => {
  const tx = await Transaction.findById(req.params.id);
  if (!tx || tx.status !== "SOFT_HOLD") {
    return res.status(400).json({ message: "Invalid transaction" });
  }

  tx.status = "REVERSED";
  await tx.save();

  await AuditLog.create({
    transactionId: tx.transactionId,
    action: "Transaction reversed due to fraud"
  });

  res.json({ message: "Transaction reversed and user protected" });
});

/* ------------------ VERIFY PAYMENT SIGNATURE ------------------ */
app.post("/verify-payment", (req, res) => {
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature
  } = req.body;

  const body = razorpay_order_id + "|" + razorpay_payment_id;

  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body)
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
    res.json({ status: "PAYMENT VERIFIED" });
  } else {
    res.status(400).json({ status: "INVALID SIGNATURE" });
  }
});

/* ------------------ START SERVER ------------------ */
app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});
