const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();

app.use(express.json());

app.use("/webhook", require("./routes/webhookRoutes"));
app.use("/api/admin", require("./routes/adminRoutes"));
app.use("/api/transactions", require("./routes/transactionRoutes"));

mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log("MongoDB connected");
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on ${process.env.PORT}`);
});
