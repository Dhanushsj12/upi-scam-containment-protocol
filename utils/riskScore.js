function calculateRisk(amount, isNewReceiver, isOddTime, rapidTransfer) {
  let score = 0;

  if (amount > 50000) score += 40;     // High amount
  if (isNewReceiver) score += 25;      // Unknown receiver
  if (isOddTime) score += 15;           // Night transaction
  if (rapidTransfer) score += 20;       // Multiple quick txns

  return Math.min(score, 100);
}

module.exports = calculateRisk;
