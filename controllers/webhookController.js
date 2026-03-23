const crypto = require("crypto");
const Transaction = require("../models/transaction");
const AuditLog = require("../models/AuditLog");
const { processSoftHold } = require("../services/softHoldService");

exports.handleWebhook = async (req, res) => {
    try {
        const secret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!secret) {
            return res.status(500).json({ message: "Webhook secret not configured" });
        }

        // 1️⃣ Verify signature using RAW body
        const signature = req.headers["x-razorpay-signature"];

        const expectedSignature = crypto
            .createHmac("sha256", secret)
            .update(req.body)
            .digest("hex");

        if (expectedSignature !== signature) {
            return res.status(400).json({ message: "Invalid webhook signature" });
        }

        // 2️⃣ Parse raw body safely
        const body = JSON.parse(req.body.toString());

        console.log("Webhook Event:", body.event);

        if (!body.payload || !body.payload.payment) {
            return res.status(400).json({ message: "Invalid webhook payload" });
        }

        const event = body.event;
        const payment = body.payload.payment.entity;
        const razorpayPaymentId = payment.id;
        const razorpayOrderId = payment.order_id;

        const transaction = await Transaction.findOne({
            razorpayOrderId: razorpayOrderId
        });

        if (!transaction) {
            return res.status(404).json({ message: "Transaction not found" });
        }

        // 🔥 HANDLE EVENTS

        // ===============================
        // PAYMENT AUTHORIZED
        // ===============================
        if (event === "payment.authorized") {

            if (transaction.status !== "PENDING") {
                return res.status(200).json({ message: "Already processed" });
            }

            const prevStatus = transaction.status;

            transaction.status = "AUTHORIZED";
            transaction.razorpayPaymentId = razorpayPaymentId;
            await transaction.save();

            await AuditLog.create({
                transactionId: transaction._id,
                action: "PAYMENT_AUTHORIZED",
                previousStatus: prevStatus,
                newStatus: "AUTHORIZED",
                actor: "system"
            });

            // 🔥 Call containment engine
            await processSoftHold(transaction);
        }

        // ===============================
        // PAYMENT CAPTURED
        // ===============================
        if (event === "payment.captured") {

            if (transaction.status === "CAPTURED") {
                return res.status(200).json({ message: "Already captured" });
            }

            const prevStatus = transaction.status;

            transaction.status = "CAPTURED";
            transaction.razorpayPaymentId = razorpayPaymentId;
            await transaction.save();

            await AuditLog.create({
                transactionId: transaction._id,
                action: "PAYMENT_CAPTURED",
                previousStatus: prevStatus,
                newStatus: "CAPTURED",
                actor: "system"
            });
        }

        // ===============================
        // PAYMENT FAILED
        // ===============================
        if (event === "payment.failed") {

            const prevStatus = transaction.status;

            transaction.status = "FAILED";
            await transaction.save();

            await AuditLog.create({
                transactionId: transaction._id,
                action: "PAYMENT_FAILED",
                previousStatus: prevStatus,
                newStatus: "FAILED",
                actor: "system"
            });
        }

        res.status(200).json({ status: "Webhook processed successfully" });

    } catch (err) {
        console.error("WEBHOOK ERROR:", err);
        res.status(500).json({
            message: "Webhook processing error",
            error: err.message
        });
    }
};