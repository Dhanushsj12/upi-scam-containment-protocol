const Transaction = require("../models/Transaction");
const AuditLog = require("../models/AuditLog");
const crypto = require("crypto");

exports.scheduleAutoRelease = (transactionId) => {
  setTimeout(async () => {
    try {
      const tx = await Transaction.findById(transactionId);

      if (tx && tx.status === "SOFT_HOLD") {
        tx.status = "COMPLETED";
        await tx.save();

        const hash = crypto
          .createHash("sha256")
          .update(tx._id + "AUTO_RELEASE" + Date.now())
          .digest("hex");

        await AuditLog.create({
          transactionId: tx._id,
          action: "Auto released after soft hold",
          hash
        });

        console.log("Auto Released:", tx._id);
      }

    } catch (err) {
      console.error("Auto release error:", err);
    }
  }, 30 * 1000); // ⚠️ 30 sec for testing (change to 10*60*1000 later)
};
