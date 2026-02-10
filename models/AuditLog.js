const mongoose = require("mongoose");
const crypto = require("crypto");

const auditSchema = new mongoose.Schema({
  transactionId: String,
  action: String,
  timestamp: { type: Date, default: Date.now },
  hash: String
});

auditSchema.pre("save", function (next) {
  this.hash = crypto
    .createHash("sha256")
    .update(this.transactionId + this.action + this.timestamp)
    .digest("hex");
  next();
});

module.exports = mongoose.model("AuditLog", auditSchema);
