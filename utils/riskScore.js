const Transaction = require("../models/transaction");
const UserProfile = require("../models/UserProfile");
const ReceiverProfile = require("../models/receiverprofile");

exports.calculateRiskScore = async (userId, receiverId, amount) => {
  try {
    let risk = 50; // Increased base risk for demo

    const sender = await UserProfile.findOne({ userId });
    const receiver = await ReceiverProfile.findOne({ receiverId });

    // Sender behaviour
    if (sender) {
      const trust = sender.trustScore || 50;
      const fraud = sender.fraudTransactions || 0;
      risk -= trust * 0.2;
      risk += fraud * 10;
    } else {
      risk += 5;
    }

    // Receiver behaviour
    if (receiver) {
      const receiverRisk = receiver.riskScore || 50;
      risk += receiverRisk * 0.3;
    } else {
      risk += 10;
    }

    // Amount risk (STRONGER EFFECT)
    const amt = Number(amount) || 0;
    risk += amt / 5000;

    // Velocity fraud
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentTransactions = await Transaction.countDocuments({
      userId,
      createdAt: { $gte: fiveMinutesAgo }
    });

    risk += recentTransactions * 5;

    // Clamp
    if (risk < 0) risk = 0;
    if (risk > 100) risk = 100;

    return Math.round(risk);

  } catch (error) {
    console.error("Risk score error:", error);
    return 50;
  }
};