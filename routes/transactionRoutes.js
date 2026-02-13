const express = require("express");
const router = express.Router();

const transactionController = require("../controllers/transactionController");

router.post("/create", transactionController.createTransaction);
router.post("/save-payment", transactionController.savePayment);
router.post("/capture/:id", transactionController.capturePayment);
router.post("/refund/:id", transactionController.refundPayment);

module.exports = router;
