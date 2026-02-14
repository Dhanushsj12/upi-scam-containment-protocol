const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
  {
    transactionId: String,
    action: String,
    previousStatus: String,
    newStatus: String,
    actor: { type: String, default: "system" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
