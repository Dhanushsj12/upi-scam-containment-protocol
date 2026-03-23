const express = require("express");
const router = express.Router();
const Blacklist = require("../models/blacklist");
const Transaction = require("../models/transaction");

// Add blacklist
router.post("/blacklist", async (req, res) => {
  const { receiverId, reason } = req.body;
  await Blacklist.create({ receiverId, reason });
  res.json({ message: "Receiver blacklisted" });
});

// Get all transactions
router.get("/transactions", async (req, res) => {
  const txns = await Transaction.find().sort({ createdAt: -1 });
  res.json(txns);
});

// Get fraud transactions
router.get("/fraud", async (req, res) => {
  const fraud = await Transaction.find({ status: "REVERSED" });
  res.json(fraud);
});

module.exports = router;