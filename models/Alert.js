const mongoose = require("mongoose");

const alertSchema = new mongoose.Schema(
  {
    transactionId: String,
    userId: String,
    reason: String,
    severity: String,
    status: { type: String, default: "OPEN" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Alert", alertSchema);
