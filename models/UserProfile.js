const mongoose = require("mongoose");

const userProfileSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, unique: true },
    avgTransactionAmount: { type: Number, default: 0 },
    totalTransactions: { type: Number, default: 0 },
    lastTransactionTime: Date,
    riskLevel: { type: String, default: "LOW" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserProfile", userProfileSchema);
