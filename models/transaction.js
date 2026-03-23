const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: String,
    receiverId: String,
    amount: Number,
    riskScore: Number,

    status: {
      type: String,
      enum: ["PENDING", "AUTHORIZED", "HOLD", "COMPLETED", "REVERSED"],
      default: "PENDING"
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,

    holdExpiresAt: Date,

    isFlagged: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);