const mongoose = require("mongoose");

const auditSchema = new mongoose.Schema({
  transactionId: String,
  action: String,
  timestamp: { type: Date, default: Date.now },
  hash: String
});

module.exports =
  mongoose.models.AuditLog ||
  mongoose.model("AuditLog", auditSchema);
