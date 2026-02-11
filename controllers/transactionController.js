const Transaction = require('../models/transaction');
const calculateRisk = require('../utils/riskScore');

// Create new transaction
exports.createTransaction = async (req, res) => {
  try {
    const { userId, amount, razorpayOrderId } = req.body;

    const transaction = new Transaction({
      userId,
      amount,
      razorpayOrderId,
      status: "PENDING"
    });

    // Calculate risk immediately
    transaction.riskScore = calculateRisk(transaction);

    await transaction.save();

    res.status(201).json(transaction);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};

// Get user's transactions
exports.getUserTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.params.userId })
      .sort({ createdAt: -1 });

    res.json(transactions);

  } catch (error) {
    res.status(500).json({ message: "Server Error" });
  }
};
