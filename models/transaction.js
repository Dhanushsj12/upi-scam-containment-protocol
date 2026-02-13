const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: String,
  receiverId: String,
  amount: Number,
  riskScore: Number,
  status: {
    type: String,
    enum: ["HOLD", "COMPLETED", "REVERSED"],
    default: "HOLD"
  },
  razorpayOrderId: String,
  razorpayPaymentId: String
}, { timestamps: true });

module.exports = mongoose.model("Transaction", transactionSchema);
