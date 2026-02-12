const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transactionController");

router.post("/create", transactionController.createTransaction);
router.post("/confirm/:id", transactionController.confirmTransaction);
router.post("/report/:id", transactionController.reportFraud);

module.exports = router;
