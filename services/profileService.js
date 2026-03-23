const UserProfile = require("../models/UserProfile");

exports.updateUserProfile = async (userId, amount) => {
  try {
    let profile = await UserProfile.findOne({ userId });

    if (!profile) {
      profile = new UserProfile({
        userId,
        totalTransactions: 0,
        totalAmount: 0
      });
    }

    profile.totalTransactions += 1;
    profile.totalAmount += amount;
    profile.lastTransactionAt = new Date();

    await profile.save();
  } catch (err) {
    console.error("UserProfile update error:", err);
  }
};