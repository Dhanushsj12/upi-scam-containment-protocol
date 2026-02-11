const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  transactionId: String,
  userId: String,
  receiverId: String,
  amount: Number,
  riskScore: Number,
  status: {
    type: String,
    enum: [
      "PENDING",
      "COMPLETED",
      "SOFT_HOLD",
      "RELEASED",
      "REVERSED",
      "FLAGGED"
    ],
    default: "PENDING"
  }
}, { timestamps: true });

module.exports =
  mongoose.models.Transaction ||
  mongoose.model("Transaction", transactionSchema);

