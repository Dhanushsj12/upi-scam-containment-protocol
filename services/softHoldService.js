const AuditLog = require("../models/AuditLog");
const Alert = require("../models/Alert");
const Blacklist = require("../models/blacklist");
const { updateReceiverProfile } = require("../utils/updatereceiverprofile");

// =====================================
// POLICY ENGINE + SOFT HOLD PROCESSING
// =====================================
const processSoftHold = async (txn) => {
  try {
    console.log("===== POLICY ENGINE START =====");
    console.log("Transaction ID:", txn._id);
    console.log("Risk Score:", txn.riskScore);
    console.log("Risk Score inside Policy Engine:", txn.riskScore);
    console.log("Final Status Set:", txn.status);

    const prevStatus = txn.status;

    // =====================================
    // BLACKLIST CHECK
    // =====================================
    const blacklisted = await Blacklist.findOne({ receiverId: txn.receiverId });
    if (blacklisted) {
      txn.status = "REVERSED";
      await txn.save();

      await AuditLog.create({
        transactionId: txn._id,
        action: "BLACKLIST_BLOCK",
        previousStatus: prevStatus,
        newStatus: "REVERSED",
        actor: "system"
      });

      await Alert.create({
        transactionId: txn._id,
        message: "Transaction blocked - Receiver blacklisted",
        severity: "HIGH"
      });

      console.log("Receiver blacklisted → Transaction reversed");
      return;
    }

    // =====================================
    // POLICY ENGINE DECISION
    // =====================================
    if (txn.riskScore < 60) {
      txn.status = "COMPLETED";
      console.log("Low risk → Completed");
    } 
    else if (txn.riskScore >= 60 && txn.riskScore < 85) {
      txn.status = "HOLD";
      txn.holdExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

      await Alert.create({
        transactionId: txn._id,
        message: "Medium risk transaction placed on HOLD",
        severity: "MEDIUM"
      });

      console.log("Medium risk → HOLD");
    } 
    else {
      txn.status = "REVERSED";

      await Alert.create({
        transactionId: txn._id,
        message: "High risk transaction automatically reversed",
        severity: "HIGH"
      });

      console.log("High risk → Reversed");
    }

    await txn.save();

    // =====================================
    // AUDIT LOG
    // =====================================
    await AuditLog.create({
      transactionId: txn._id,
      action: "POLICY_DECISION",
      previousStatus: prevStatus,
      newStatus: txn.status,
      actor: "system"
    });

    // =====================================
    // UPDATE RECEIVER PROFILE
    // =====================================
    await updateReceiverProfile(txn.receiverId, txn.status, txn.amount);

    console.log("===== POLICY ENGINE END =====");

  } catch (error) {
    console.error("Policy Engine Error:", error);
  }
};

module.exports = { processSoftHold };