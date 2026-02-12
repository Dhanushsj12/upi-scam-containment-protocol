const crypto = require("crypto");
const Transaction = require("../models/Transaction");
const AuditLog = require("../models/AuditLog");
const calculateRisk = require("../utils/riskScore");
const { scheduleAutoRelease } = require("../services/softHoldService");

/* ================= CREATE TRANSACTION ================= */
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

    let status = "COMPLETED";
    if (riskScore >= 70) status = "SOFT_HOLD";

    const transaction = await Transaction.create({
      userId,
      receiverId,
      amount,
      riskScore,
      status
    });

    if (status === "SOFT_HOLD") {
      scheduleAutoRelease(transaction._id);
    }

    const hash = crypto
      .createHash("sha256")
      .update(transaction._id + status + Date.now())
      .digest("hex");

    await AuditLog.create({
      transactionId: transaction._id,
      action: `Transaction ${status}`,
      hash
    });

    res.status(201).json(transaction);

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server Error" });
  }
};

/* ================= CONFIRM ================= */
exports.confirmTransaction = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);

    if (!tx) return res.status(404).json({ message: "Not found" });

    if (tx.status !== "SOFT_HOLD") {
      return res.status(400).json({
        message: "Transaction already processed"
      });
    }

    tx.status = "COMPLETED";
    await tx.save();

    res.json({ message: "Transaction confirmed" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

/* ================= REPORT FRAUD ================= */
exports.reportFraud = async (req, res) => {
  try {
    const tx = await Transaction.findById(req.params.id);

    if (!tx) return res.status(404).json({ message: "Not found" });

    if (tx.status !== "SOFT_HOLD") {
      return res.status(400).json({
        message: "Cannot reverse this transaction"
      });
    }

    tx.status = "REVERSED";
    await tx.save();

    res.json({ message: "Transaction reversed" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
