const express = require("express");
const router = express.Router();
const Video = require("./models/videomodel");
const { protect, adminOnly } = require("../middleware/authMiddleware");

// Get all videos (Admin can see all)
router.get("/videos", protect, adminOnly, async (req, res) => {
  try {
    const videos = await Video.find().sort({ createdAt: -1 });
    res.json(videos);
  } catch (err) {
    res.status(500).json({ message: "Error fetching videos", error: err.message });
  }
});

module.exports = router;
