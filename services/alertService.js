const Alert = require("../models/Alert");

exports.createAlert = async (transaction, reason, severity) => {
  return Alert.create({
    transactionId: transaction._id,
    userId: transaction.userId,
    reason,
    severity
  });
};
