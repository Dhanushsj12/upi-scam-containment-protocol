const mongoose = require("mongoose");

const blacklistSchema = new mongoose.Schema({
  receiverId: String,
  reason: String
}, { timestamps: true });

module.exports = mongoose.model("Blacklist", blacklistSchema);