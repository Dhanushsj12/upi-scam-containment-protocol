const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: String,
  receiverId: String,
  amount: Number,
  riskScore: Number,
  status: {
    type: String,
    enum: ["COMPLETED", "SOFT_HOLD", "REVERSED"],
    default: "COMPLETED"
  }
}, { timestamps: true });

module.exports =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);
