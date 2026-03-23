const Transaction = require("../models/transaction");
const Alert = require("../models/Alert");

/**
 * 📊 Overview metrics
 */
exports.overview = async (req, res) => {
  try {
    const total = await Transaction.countDocuments();
    const holds = await Transaction.countDocuments({ status: "HOLD" });
    const completed = await Transaction.countDocuments({ status: "COMPLETED" });
    const reversed = await Transaction.countDocuments({ status: "REVERSED" });
    const flagged = await Transaction.countDocuments({ isFlagged: true });

    res.json({ total, holds, completed, reversed, flagged });
  } catch (err) {
    res.status(500).json({ message: "Analytics error" });
  }
};


/**
 * 🚨 High risk transactions
 */
exports.highRisk = async (req, res) => {
  try {
    const txs = await Transaction.find({ isFlagged: true }).sort({ createdAt: -1 });
    res.json(txs);
  } catch (err) {
    res.status(500).json({ message: "High risk fetch error" });
  }
};


/**
 * 👤 User analytics
 */
exports.userAnalytics = async (req, res) => {
  try {
    const userTx = await Transaction.find({ userId: req.params.id });
    res.json(userTx);
  } catch (err) {
    res.status(500).json({ message: "User analytics error" });
  }
};


/**
 * 🚨 Alerts list
 */
exports.getAlerts = async (req, res) => {
  try {
    const alerts = await Alert.find().sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) {
    res.status(500).json({ message: "Alerts fetch error" });
  }
};


/**
 * 📈 Risk score distribution
 */
exports.riskDistribution = async (req, res) => {
  try {
    const low = await Transaction.countDocuments({ riskScore: { $lt: 60 } });
    const medium = await Transaction.countDocuments({
      riskScore: { $gte: 60, $lt: 85 }
    });
    const high = await Transaction.countDocuments({ riskScore: { $gte: 85 } });

    res.json({ low, medium, high });
  } catch (err) {
    res.status(500).json({ message: "Risk distribution error" });
  }
};


/**
 * 📅 Transactions per day
 */
exports.transactionsPerDay = async (req, res) => {
  try {
    const data = await Transaction.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Daily transactions error" });
  }
};