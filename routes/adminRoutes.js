const express = require("express");
const router = express.Router();
const {
  getHolds,
  approveTransaction,
  rejectTransaction,
} = require("../controllers/adminController");

router.get("/holds", getHolds);
router.post("/approve/:id", approveTransaction);
router.post("/reject/:id", rejectTransaction);

module.exports = router;
