const express = require("express");
const router = express.Router();
const controller = require("../controllers/transactionController");

router.post("/create", controller.createTransaction);
router.post("/save-payment", controller.savePayment);
router.get("/status/:id", controller.getTransactionStatus);
router.post("/confirm", controller.confirmPayment);
router.post("/cancel", controller.cancelPayment);

module.exports = router;