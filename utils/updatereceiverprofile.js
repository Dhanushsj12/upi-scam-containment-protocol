const ReceiverProfile = require("../models/receiverprofile");

exports.updateReceiverProfile = async (receiverId, status, amount) => {

  let profile = await ReceiverProfile.findOne({ receiverId });

  if (!profile) {
    profile = new ReceiverProfile({ receiverId });
  }

  profile.totalReceived += amount;

  if (status === "HOLD") {
    profile.holdTransactions += 1;
    profile.riskScore += 10;
  }

  if (status === "REVERSED") {
    profile.fraudReports += 1;
    profile.riskScore += 20;
  }

  if (profile.riskScore > 100) profile.riskScore = 100;

  await profile.save();
};