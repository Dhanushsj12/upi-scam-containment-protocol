const express = require("express");
const router = express.Router();

const analyticsController = require("../controllers/analyticsController");

// Overview
router.get("/overview", analyticsController.overview);

// High risk transactions
router.get("/high-risk", analyticsController.highRisk);

// User analytics
router.get("/user/:id", analyticsController.userAnalytics);

// Alerts
router.get("/alerts", analyticsController.getAlerts);

// Risk distribution
router.get("/risk-distribution", analyticsController.riskDistribution);

// Daily transactions
router.get("/daily-transactions", analyticsController.transactionsPerDay);

module.exports = router;