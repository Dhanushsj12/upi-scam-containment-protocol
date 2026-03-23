const Transaction = require("../models/transaction");
const razorpay = require("../config/razorpay");
const AuditLog = require("../models/AuditLog");

exports.forceCapture = async (req, res) => {
    const { transactionId } = req.body;

    const txn = await Transaction.findById(transactionId);

    if (!txn) return res.status(404).json({ message: "Transaction not found" });

    await razorpay.payments.capture(
        txn.razorpayPaymentId,
        txn.amount * 100
    );

    const prevStatus = txn.status;
    txn.status = "COMPLETED";
    await txn.save();

    await AuditLog.create({
        transactionId: txn._id,
        action: "ADMIN_FORCE_CAPTURE",
        previousStatus: prevStatus,
        newStatus: "COMPLETED",
        actor: "admin"
    });

    res.json({ message: "Force captured" });
};


exports.forceRefund = async (req, res) => {
    const { transactionId } = req.body;

    const txn = await Transaction.findById(transactionId);

    if (!txn) return res.status(404).json({ message: "Transaction not found" });

    await razorpay.payments.refund(txn.razorpayPaymentId);

    const prevStatus = txn.status;
    txn.status = "REVERSED";
    await txn.save();

    await AuditLog.create({
        transactionId: txn._id,
        action: "ADMIN_FORCE_REFUND",
        previousStatus: prevStatus,
        newStatus: "REVERSED",
        actor: "admin"
    });

    res.json({ message: "Force refunded" });
};