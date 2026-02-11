const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/transactions', adminController.getAllTransactions);
router.get('/transactions/:id', adminController.getTransactionById);

router.post('/flag/:id', adminController.flagTransaction);
router.post('/release/:id', adminController.releaseTransaction);

module.exports = router;
