const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transactionId: { type: String, required: true },
  userId: { type: String, required: true },
  receiverId: { type: String, required: true },
  amount: { type: Number, required: true },
  riskScore: { type: Number },
  status: {
    type: String,
    enum: ["INITIATED", "SOFT_HOLD", "COMPLETED", "REVERSED"],
    default: "INITIATED"
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Transaction", transactionSchema);
