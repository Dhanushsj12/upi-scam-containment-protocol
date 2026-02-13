const Razorpay = require("razorpay");
const Transaction = require("../models/transaction");
const calculateRisk = require("../utils/riskScore");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

exports.createTransaction = async (req, res) => {
  try {
    const { userId, receiverId, amount } = req.body;

    const isNewReceiver = true;
    const isOddTime = new Date().getHours() < 6;
    const rapidTransfer = false;

    const riskScore = calculateRisk(
      amount,
      isNewReceiver,
      isOddTime,
      rapidTransfer
    );

    let status = riskScore >= 70 ? "HOLD" : "COMPLETED";

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR"
    });

    const transaction = await Transaction.create({
      userId,
      receiverId,
      amount,
      riskScore,
      status,
      razorpayOrderId: order.id
    });

    res.json({
      message: "Order created",
      orderId: order.id,
      transactionId: transaction._id,
      status
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Order creation failed" });
  }
};

exports.savePayment = async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;

    const tx = await Transaction.findOne({ razorpayOrderId: orderId });

    if (!tx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    tx.razorpayPaymentId = paymentId;
    await tx.save();

    // 🔥 ADD THIS LINE HERE
    console.log("Updated TX:", tx);

    res.json({ message: "Payment recorded successfully" });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Save payment failed" });
  }
};


exports.capturePayment = async (req, res) => {
  res.json({ message: "capture working" });
};

exports.refundPayment = async (req, res) => {
  res.json({ message: "refund working" });
};
