const Transaction = require("../models/transaction");

exports.processExpiredHolds = async () => {
  try {
    const expired = await Transaction.find({
      status: "HOLD",
      holdExpiresAt: { $lt: new Date() }
    });

    for (let tx of expired) {
      tx.status = "REVERSED";
      await tx.save();
      console.log("Expired HOLD reversed:", tx._id);
    }

  } catch (error) {
    console.error("Hold expiry error:", error);
  }
};