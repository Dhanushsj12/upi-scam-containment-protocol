const Transaction = require("../models/transaction");
const razorpay = require("../config/razorpay");
const AuditLog = require("../models/AuditLog");
const Alert = require("../models/Alert");


// =====================================
// POLICY ENGINE + SOFT HOLD
// =====================================
exports.processSoftHold = async (txn) => {
  try {
    console.log("===== POLICY ENGINE START =====");
    console.log("Risk Score:", txn.riskScore);

    let prevStatus = txn.status;

    // LOW RISK → AUTO COMPLETE
    if (txn.riskScore < 60) {
      txn.status = "COMPLETED";
      txn.isFlagged = false;

      await txn.save();

      await AuditLog.create({
        transactionId: txn._id,
        action: "AUTO_COMPLETED_LOW_RISK",
        previousStatus: prevStatus,
        newStatus: "COMPLETED",
        actor: "system"
      });

      console.log("LOW RISK → COMPLETED");
    }

    // MEDIUM RISK → HOLD
    else if (txn.riskScore >= 60 && txn.riskScore < 85) {
      txn.status = "HOLD";
      txn.isFlagged = true;
      txn.holdExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

      await txn.save();

      await Alert.create({
        userId: txn.userId,
        message: "⚠ High Risk Receiver Detected. Confirm within 2 minutes."
      });

      await AuditLog.create({
        transactionId: txn._id,
        action: "SOFT_HOLD_APPLIED",
        previousStatus: prevStatus,
        newStatus: "HOLD",
        actor: "system"
      });

      console.log("MEDIUM RISK → HOLD");
    }

    // HIGH RISK → AUTO REVERSE
    else {
      txn.status = "REVERSED";
      txn.isFlagged = true;

      await txn.save();

      await Alert.create({
        userId: txn.userId,
        message: "🚨 Fraudulent Transaction Blocked Automatically."
      });

      await AuditLog.create({
        transactionId: txn._id,
        action: "AUTO_REVERSED_HIGH_RISK",
        previousStatus: prevStatus,
        newStatus: "REVERSED",
        actor: "system"
      });

      console.log("HIGH RISK → REVERSED");
    }

    console.log("===== POLICY ENGINE END =====");

  } catch (error) {
    console.error("Policy Engine Error:", error);
  }
};


// =====================================
// HOLD EXPIRY WORKER
// =====================================
exports.processExpiredHolds = async () => {
  try {
    const expiredTxns = await Transaction.find({
      status: "HOLD",
      holdExpiresAt: { $lt: new Date() }
    });

    for (let txn of expiredTxns) {
      const prevStatus = txn.status;

      txn.status = "REVERSED";
      await txn.save();

      await AuditLog.create({
        transactionId: txn._id,
        action: "AUTO_REFUND_HOLD_EXPIRED",
        previousStatus: prevStatus,
        newStatus: "REVERSED",
        actor: "system"
      });

      console.log("Expired HOLD reversed:", txn._id);
    }

  } catch (error) {
    console.error("Expired Hold Error:", error);
  }
};