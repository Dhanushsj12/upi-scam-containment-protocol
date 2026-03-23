const Transaction = require("../models/transaction");
const Blacklist = require("../models/blacklist");

exports.calculateRiskScore = async (userId, receiverId, amount) => {
  let score = 0;

  // High amount risk
  if (amount > 10000) score += 30;
  if (amount > 50000) score += 40;

  // Blacklisted receiver
  const blacklisted = await Blacklist.findOne({ receiverId });
  if (blacklisted) score += 50;

  // Velocity fraud detection (many transactions)
  const recentTransactions = await Transaction.countDocuments({
    userId,
    createdAt: { $gt: new Date(Date.now() - 60000) }
  });

  if (recentTransactions > 3) score += 25;

  // Night transaction risk
  const hour = new Date().getHours();
  if (hour >= 0 && hour <= 5) score += 10;

  return score;
};