const Blacklist = require("../models/blacklist");

exports.addToBlacklist = async (receiverId) => {
  const exists = await Blacklist.findOne({ receiverId });

  if (!exists) {
    await Blacklist.create({
      receiverId,
      reason: "Fraud detected"
    });
  }
};

exports.isBlacklisted = async (receiverId) => {
  const exists = await Blacklist.findOne({ receiverId });
  return !!exists;
};