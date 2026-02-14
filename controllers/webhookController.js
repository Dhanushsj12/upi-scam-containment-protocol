const Transaction = require("../models/transaction");
const AuditLog = require("../models/AuditLog");

exports.handleWebhook = async (req, res) => {
  try {
    console.log("Webhook received:", req.body);

    const event = req.body.event;

    if (!req.body.payload || !req.body.payload.payment) {
      return res.status(400).json({ message: "Invalid webhook payload" });
    }

    const payment = req.body.payload.payment.entity;

    const transaction = await Transaction.findOne({
      razorpayOrderId: payment.order_id
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    const prevStatus = transaction.status;

    if (event === "payment.captured") {
      transaction.status = "AUTHORIZED";
      transaction.razorpayPaymentId = payment.id;
      await transaction.save();

      await AuditLog.create({
        transactionId: transaction._id,
        action: "AUTO_CAPTURED",
        previousStatus: prevStatus,
        newStatus: "AUTHORIZED",
        actor: "system"
      });
    }

    if (event === "payment.failed") {
      transaction.status = "REVERSED";
      await transaction.save();

      await AuditLog.create({
        transactionId: transaction._id,
        action: "PAYMENT_FAILED",
        previousStatus: prevStatus,
        newStatus: "REVERSED",
        actor: "system"
      });
    }

    res.json({ status: "ok" });

  } catch (err) {
    console.error("WEBHOOK ERROR:", err);
    res.status(500).json({ message: "Webhook error", error: err.message });
  }
};
