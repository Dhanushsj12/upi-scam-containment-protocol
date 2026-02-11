const Transaction = require('../models/Transaction');

exports.handleWebhook = async (req, res) => {
  try {
    const event = req.body.event;

    if (event === 'payment.captured') {
      const payment = req.body.payload?.payment?.entity;

      if (!payment) {
        return res.status(400).json({ message: "Invalid payload" });
      }

      const txn = await Transaction.findOne({
        transactionId: payment.order_id
      });

      if (!txn) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      txn.status = "COMPLETED";
      await txn.save();
    }

    res.status(200).json({ message: "Webhook processed" });

  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
};
