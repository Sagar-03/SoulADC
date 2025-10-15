const express = require("express");
const router = express.Router();
const Doubt = require("../models/Doubt");

// Get all doubts (for admin)
router.get("/", async (req, res) => {
  try {
    const doubts = await Doubt.find().sort({ createdAt: -1 });
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get doubts for a specific student
router.get("/student/:id", async (req, res) => {
  try {
    const doubts = await Doubt.find({ studentId: req.params.id, status: "open" });
    res.json(doubts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
