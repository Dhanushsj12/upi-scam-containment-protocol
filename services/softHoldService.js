const Transaction = require('../models/Transaction');

async function applySoftHold(transactionId) {
  const txn = await Transaction.findById(transactionId);
  if (!txn) return;

  txn.status = 'SOFT_HOLD';
  await txn.save();

  setTimeout(async () => {
    const updatedTxn = await Transaction.findById(transactionId);

    if (updatedTxn.status === 'SOFT_HOLD') {
      updatedTxn.status = 'RELEASED';
      await updatedTxn.save();
      console.log("Funds Released");
    }
  }, 10 * 60 * 1000);
}

module.exports = { applySoftHold };
