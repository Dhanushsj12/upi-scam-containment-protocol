const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true },
    amount: { type: Number, required: true },
    riskScore: { type: Number, default: 0 },

    status: {
      type: String,
      enum: ["PENDING", "HOLD", "AUTHORIZED", "COMPLETED", "REVERSED"],
      default: "PENDING",
    },

    razorpayOrderId: String,
    razorpayPaymentId: String,
    razorpaySignature: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Transaction", transactionSchema);
