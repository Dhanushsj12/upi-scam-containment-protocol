const razorpay = require("../config/razorpay");
const Transaction = require("../models/transaction");
const AuditLog = require("../models/AuditLog");
const { updateUserProfile } = require("../services/profileService");
const { createAlert } = require("../services/alertService");
const { processSoftHold } = require("../services/softHoldService");
const { calculateRiskScore } = require("../utils/riskScore");


// =====================================
// CREATE TRANSACTION
// =====================================
exports.createTransaction = async (req, res) => {
  try {
    console.log("Create Transaction API called");

    const { userId, receiverId, amount } = req.body;

    if (!userId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Update profile
    await updateUserProfile(userId, amount);

    // Calculate risk score
    const riskScore = await calculateRiskScore(userId, receiverId, amount);

    // Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
      payment_capture: 0
    });

    // Save transaction
    const transaction = await Transaction.create({
      userId,
      receiverId,
      amount,
      riskScore,
      status: "PENDING",
      razorpayOrderId: order.id
    });

    await AuditLog.create({
      transactionId: transaction._id,
      action: "TRANSACTION_CREATED",
      previousStatus: null,
      newStatus: "PENDING",
      actor: "system"
    });

    res.json({
    message: "Order created",
    orderId: order.id,
    transactionId: transaction._id,
    status: transaction.status,
    riskScore: transaction.riskScore
});

  } catch (error) {
    console.error("Create Transaction Error:", error);
    res.status(500).json({ message: "Order creation failed" });
  }
};


// =====================================
// SAVE PAYMENT AFTER CHECKOUT
// =====================================
exports.savePayment = async (req, res) => {
  try {
    console.log("===== SAVE PAYMENT START =====");

    const { paymentId } = req.body;
    console.log("Payment ID:", paymentId);

    // Find latest pending transaction
    const tx = await Transaction.findOne({ status: "PENDING" }).sort({ createdAt: -1 });

    if (!tx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    console.log("Transaction found:", tx._id);

    tx.razorpayPaymentId = paymentId;
    tx.status = "AUTHORIZED";
    await tx.save();

    console.log("Status updated to AUTHORIZED");

    // Run policy engine
    await processSoftHold(tx);

    console.log("Soft hold processing done");

    res.json({
      message: "Payment processed",
      status: tx.status
    });

  } catch (error) {
    console.error("Save Payment Error:", error);
    res.status(500).json({ message: "Save payment failed" });
  }
};

// CONFIRM PAYMENT
exports.confirmPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;
    console.log("CONFIRM called for:", transactionId);

    const txn = await Transaction.findById(transactionId);

    if (!txn) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (txn.status !== "HOLD") {
      return res.json({ message: "Transaction not in HOLD state" });
    }

    txn.status = "COMPLETED";
    await txn.save();

    res.json({ message: "Payment Confirmed", status: txn.status });

  } catch (error) {
    console.error("Confirm error:", error);
  }
};


// CANCEL PAYMENT
exports.cancelPayment = async (req, res) => {
  try {
    const { transactionId } = req.body;
    console.log("CANCEL called for:", transactionId);

    const txn = await Transaction.findById(transactionId);

    if (!txn) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (txn.status !== "HOLD") {
      return res.json({ message: "Transaction not in HOLD state" });
    }

    txn.status = "REVERSED";
    await txn.save();

    res.json({ message: "Payment Cancelled", status: txn.status });

  } catch (error) {
    console.error("Cancel error:", error);
  }
};

// =====================================
// USER HISTORY
// =====================================
exports.getUserHistory = async (req, res) => {
  try {
    const history = await Transaction.find({
      userId: req.params.userId
    }).sort({ createdAt: -1 });

    res.json(history);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to fetch history" });
  }
};


// =====================================
// TRANSACTION STATUS
// =====================================
exports.getTransactionStatus = async (req, res) => {
  try {
    console.log("Status API called for ID:", req.params.id);

    const txn = await Transaction.findById(req.params.id);

    if (!txn) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({
      status: txn.status,
      riskScore: txn.riskScore || 0,
      holdExpiresAt: txn.holdExpiresAt || null
    });

  } catch (error) {
    console.error("Status Error:", error);
    res.status(500).json({ message: "Status fetch failed" });
  }
};