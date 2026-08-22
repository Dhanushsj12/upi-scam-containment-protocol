const UserProfile = require("../models/UserProfile");

exports.updateUserProfile = async (userId, amount, status) => {

  let profile = await UserProfile.findOne({ userId });

  if (!profile) {
    profile = new UserProfile({ userId });
  }

  profile.totalTransactions += 1;

  // Update average amount
  profile.avgAmount =
    ((profile.avgAmount * (profile.totalTransactions - 1)) + amount)
    / profile.totalTransactions;

  if (status === "COMPLETED") {
    profile.successfulTransactions += 1;
    profile.trustScore += 3;
  }

  if (status === "REVERSED") {
    profile.fraudTransactions += 1;
    profile.trustScore -= 8;
  }

  if (profile.trustScore > 100) profile.trustScore = 100;
  if (profile.trustScore < 0) profile.trustScore = 0;

  await profile.save();
};