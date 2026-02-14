const Razorpay = require("razorpay");
const Transaction = require("../models/transaction");
const AuditLog = require("../models/AuditLog");
const calculateRisk = require("../utils/riskScore");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * 🟢 CREATE TRANSACTION
 * Creates Razorpay order + stores transaction
 */
exports.createTransaction = async (req, res) => {
  try {
    const { userId, receiverId, amount } = req.body;

    // ✅ Basic validation
    if (!userId || !amount) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    if (amount <= 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    // 🧠 Risk Engine
    const isNewReceiver = true;
    const isOddTime = new Date().getHours() < 6;
    const rapidTransfer = false;

    const riskScore = calculateRisk(
      amount,
      isNewReceiver,
      isOddTime,
      rapidTransfer
    );

    // 🎯 Status logic
    let status = riskScore > 50 ? "HOLD" : "PENDING";

    console.log("Creating order for amount:", amount);

    // 💳 Create Razorpay Order
    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    });

    console.log("Order created:", order.id);

    // 💾 Save Transaction in DB
    const transaction = await Transaction.create({
      userId,
      receiverId,
      amount,
      riskScore,
      status,
      razorpayOrderId: order.id
    });

    console.log("Inserted transaction:", transaction._id);

    // 🧾 Audit log
    await AuditLog.create({
      transactionId: transaction._id,
      action: "CREATED",
      previousStatus: null,
      newStatus: status,
      actor: "system"
    });

    res.json({
      message: "Order created",
      orderId: order.id,
      transactionId: transaction._id,
      status
    });

  } catch (error) {
    console.error("CREATE TX ERROR:", error);
    res.status(500).json({
      message: "Order creation failed",
      error: error.message
    });
  }
};

/**
 * 🟢 SAVE PAYMENT AFTER SUCCESS (Fallback if webhook not used)
 */
exports.savePayment = async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;

    const tx = await Transaction.findOne({ razorpayOrderId: orderId });

    if (!tx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const prevStatus = tx.status;

    tx.razorpayPaymentId = paymentId;
    tx.status = "AUTHORIZED";
    await tx.save();

    await AuditLog.create({
      transactionId: tx._id,
      action: "PAYMENT_RECORDED",
      previousStatus: prevStatus,
      newStatus: "AUTHORIZED"
    });

    console.log("Updated TX:", tx._id);

    res.json({ message: "Payment recorded successfully" });

  } catch (error) {
    console.error("SAVE PAYMENT ERROR:", error);
    res.status(500).json({ message: "Save payment failed" });
  }
};

/**
 * 🟢 CAPTURE PAYMENT (Admin approval simulation)
 */
exports.capturePayment = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);

    if (!tx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const prevStatus = tx.status;

    // ✅ Simulated capture (no Razorpay API)
    tx.status = "COMPLETED";
    await tx.save();

    await AuditLog.create({
      transactionId: tx._id,
      action: "CAPTURED",
      previousStatus: prevStatus,
      newStatus: "COMPLETED",
      actor: "admin"
    });

    res.json({
      message: "Payment captured successfully (simulated)"
    });

  } catch (error) {
    console.error("CAPTURE ERROR:", error);
    res.status(500).json({ message: "Capture failed" });
  }
};


/**
 * 🟢 REFUND PAYMENT
 */
exports.refundPayment = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);

    if (!tx) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const prevStatus = tx.status;

    // ✅ Simulated refund (no Razorpay call)
    tx.status = "REVERSED";
    await tx.save();

    await AuditLog.create({
      transactionId: tx._id,
      action: "REFUNDED",
      previousStatus: prevStatus,
      newStatus: "REVERSED",
      actor: "admin"
    });

    res.json({
      message: "Payment refunded successfully (simulated)"
    });

  } catch (error) {
    console.error("REFUND ERROR:", error);
    res.status(500).json({ message: "Refund failed" });
  }
};
