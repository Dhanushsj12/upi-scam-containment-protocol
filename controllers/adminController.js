const Transaction = require('../models/transaction');
const AuditLog = require('../models/AuditLog');

// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get single transaction
exports.getTransactionById = async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ message: "Transaction not found" });

    res.json(txn);
  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Flag transaction
exports.flagTransaction = async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ message: "Transaction not found" });

    txn.status = "FLAGGED";
    await txn.save();

    await AuditLog.create({
      transactionId: txn._id,
      action: "FLAGGED_BY_ADMIN"
    });

    res.json({ message: "Transaction flagged successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Manually release transaction
exports.releaseTransaction = async (req, res) => {
  try {
    const txn = await Transaction.findById(req.params.id);
    if (!txn) return res.status(404).json({ message: "Transaction not found" });

    txn.status = "RELEASED";
    await txn.save();

    await AuditLog.create({
      transactionId: txn._id,
      action: "MANUALLY_RELEASED_BY_ADMIN"
    });

    res.json({ message: "Transaction released successfully" });

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
