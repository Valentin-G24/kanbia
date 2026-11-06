const express = require("express");
const mongoose = require("mongoose");

const router = express.Router();

router.get("/health", async (req, res) => {
  try {
    await mongoose.connection.db.admin().ping();
    await mongoose.connection.db.collection("users").countDocuments({}, { limit: 1 });
    res.status(200).json({ status: "ok", db: "connected", time: new Date() });
  } catch (err) {
    res.status(500).json({ status: "error", db: "disconnected" });
  }
});

module.exports = router;