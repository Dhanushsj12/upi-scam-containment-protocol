const mongoose = require("mongoose");

const receiverSchema = new mongoose.Schema({
  receiverId: { type: String, unique: true },
  riskScore: { type: Number, default: 50 },
  totalReceived: { type: Number, default: 0 },
  fraudReports: { type: Number, default: 0 },
  holdTransactions: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("ReceiverProfile", receiverSchema);