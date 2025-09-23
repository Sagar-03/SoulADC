const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const Course = require("../models/Course.js");



/**
 * POST /api/admin/save-content
 * { course, week, day, videoKey?, docKey? }
 */
router.post("/save-content", async (req, res) => {
  try {
    const { course, week, day, videoKey, docKey } = req.body;

    if (!course || !week || !day) {
      return res.status(400).json({ error: "course, week, day are required" });
    }

    let courseDoc = await Course.findOne({ title: course });
    if (!courseDoc) {
      courseDoc = new Course({ title: course, weeks: [] });
    }

    let weekDoc = courseDoc.weeks.find((w) => Number(w.weekNumber) === Number(week));
    if (!weekDoc) {
      weekDoc = { weekNumber: Number(week), title: `Week ${week}`, contents: [] };
      courseDoc.weeks.push(weekDoc);
    }

    const createdContentIds = [];

    if (videoKey) {
      const c = {
        type: "video",
        title: `Week ${week} - Day ${day} Video`,
        s3Key: videoKey,
      };
      weekDoc.contents.push(c);
      createdContentIds.push(weekDoc.contents[weekDoc.contents.length - 1]._id);
    }

    if (docKey) {
      const c = {
        type: docKey.toLowerCase().endsWith(".pdf") ? "pdf" : "document",
        title: `Week ${week} - Day ${day} Document`,
        s3Key: docKey,
      };
      weekDoc.contents.push(c);
      createdContentIds.push(weekDoc.contents[weekDoc.contents.length - 1]._id);
    }

    await courseDoc.save();

    res.json({
      success: true,
      message: "Saved content metadata",
      courseId: courseDoc._id,
      weekNumber: weekDoc.weekNumber,
      contentIds: createdContentIds, // use these for streaming later
    });
  } catch (err) {
    console.error("save-content error:", err);
    res.status(500).json({ error: err.message });
  }
});
// Admin dashboard route - basic structure for future implementation
router.get("/admindashboard", protect, adminOnly, async (req, res) => {
  try {
    // Basic admin dashboard data - you can implement this later
    res.json({ 
      message: "Admin dashboard",
      stats: {
        totalUsers: 0,
        totalCourses: 0,
        totalEnrollments: 0
      }
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching admin data", error: err.message });
  }
});

module.exports = router;
