const Transaction = require("../models/transaction");
const AuditLog = require("../models/AuditLog");

exports.getHolds = async (req, res) => {
  const holds = await Transaction.find({ status: "HOLD" });
  res.json(holds);
};

exports.approveTransaction = async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) return res.status(404).json({ msg: "Not found" });

  const prevStatus = transaction.status;
  transaction.status = "COMPLETED";
  await transaction.save();

  await AuditLog.create({
    transactionId: transaction._id,
    action: "APPROVED",
    previousStatus: prevStatus,
    newStatus: "COMPLETED",
    actor: "admin",
  });

  res.json({ message: "Transaction approved" });
};

exports.rejectTransaction = async (req, res) => {
  const transaction = await Transaction.findById(req.params.id);
  if (!transaction) return res.status(404).json({ msg: "Not found" });

  const prevStatus = transaction.status;
  transaction.status = "REVERSED";
  await transaction.save();

  await AuditLog.create({
    transactionId: transaction._id,
    action: "REJECTED",
    previousStatus: prevStatus,
    newStatus: "REVERSED",
    actor: "admin",
  });

  res.json({ message: "Transaction rejected" });
};
