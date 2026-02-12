function calculateRisk(amount, isNewReceiver, isOddTime, rapidTransfer) {
  let score = 0;

  if (amount > 50000) score += 50;
  if (isNewReceiver) score += 25;
  if (isOddTime) score += 15;
  if (rapidTransfer) score += 20;

  return Math.min(score, 100);
}

module.exports = calculateRisk;
