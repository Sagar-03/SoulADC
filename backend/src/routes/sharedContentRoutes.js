const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const SharedContent = require("../models/SharedContent");
const Course = require("../models/Course");
const router = express.Router();

/**
 * POST /api/admin/shared-content
 * Create new shared content structure
 */
router.post("/", protect, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Content name is required" });
    }

    const sharedContent = new SharedContent({
      name,
      description,
      weeks: []
    });

    await sharedContent.save();
    res.status(201).json(sharedContent);
  } catch (err) {
    console.error("❌ Error creating shared content:", err);
    res.status(500).json({ error: "Failed to create shared content" });
  }
});

/**
 * GET /api/admin/shared-content
 * Get all shared content
 */
router.get("/", protect, adminOnly, async (req, res) => {
  try {
    const sharedContents = await SharedContent.find();
    
    // Add course count for each shared content
    const contentsWithCounts = await Promise.all(
      sharedContents.map(async (content) => {
        const courseCount = await Course.countDocuments({ sharedContentId: content._id });
        return {
          ...content.toObject(),
          courseCount
        };
      })
    );
    
    res.json(contentsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/shared-content/:id
 * Get specific shared content
 */
router.get("/:id", protect, adminOnly, async (req, res) => {
  try {
    const sharedContent = await SharedContent.findById(req.params.id);
    if (!sharedContent) {
      return res.status(404).json({ error: "Shared content not found" });
    }
    res.json(sharedContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/shared-content/:id/weeks
 * Add a week to shared content
 */
router.post("/:id/weeks", protect, adminOnly, async (req, res) => {
  try {
    const { weekNumber, title } = req.body;
    const sharedContent = await SharedContent.findById(req.params.id);
    
    if (!sharedContent) {
      return res.status(404).json({ error: "Shared content not found" });
    }

    // Create a week with 7 days
    const days = [];
    for (let i = 1; i <= 7; i++) {
      days.push({
        dayNumber: i,
        title: `Day ${i}`,
        contents: []
      });
    }

    sharedContent.weeks.push({ weekNumber, title, days });
    await sharedContent.save();
    res.json(sharedContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/shared-content/:contentId/weeks/:weekId/days/:dayId/contents
 * Add content to a specific day in shared content
 */
router.post("/:contentId/weeks/:weekId/days/:dayId/contents", protect, adminOnly, async (req, res) => {
  try {
    const { type, title, s3Key } = req.body;
    const sharedContent = await SharedContent.findById(req.params.contentId);
    
    if (!sharedContent) {
      return res.status(404).json({ error: "Shared content not found" });
    }

    const week = sharedContent.weeks.id(req.params.weekId);
    if (!week) return res.status(404).json({ error: "Week not found" });

    const day = week.days.id(req.params.dayId);
    if (!day) return res.status(404).json({ error: "Day not found" });

    day.contents.push({ type, title, s3Key });
    await sharedContent.save();
    res.json(sharedContent);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/shared-content/:contentId/weeks/:weekId/days/:dayId/contents/:contentItemId
 * Delete content from shared content
 */
router.delete("/:contentId/weeks/:weekId/days/:dayId/contents/:contentItemId", protect, adminOnly, async (req, res) => {
  try {
    const { contentId, weekId, dayId, contentItemId } = req.params;
    const sharedContent = await SharedContent.findById(contentId);
    
    if (!sharedContent) {
      return res.status(404).json({ error: "Shared content not found" });
    }

    const week = sharedContent.weeks.id(weekId);
    if (!week) return res.status(404).json({ error: "Week not found" });

    const day = week.days.id(dayId);
    if (!day) return res.status(404).json({ error: "Day not found" });

    const content = day.contents.id(contentItemId);
    if (!content) return res.status(404).json({ error: "Content not found" });

    // Delete from S3 if available
    try {
      const s3 = require("../config/s3");
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");
      const deleteParams = {
        Bucket: process.env.AWS_S3_BUCKET,
        Key: content.s3Key
      };
      await s3.send(new DeleteObjectCommand(deleteParams));
    } catch (s3Error) {
      console.warn("Failed to delete from S3:", s3Error.message);
    }

    content.deleteOne();
    await sharedContent.save();
    res.json({ success: true, message: "Content deleted" });
  } catch (err) {
    console.error("delete-content error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/shared-content/:id
 * Update shared content details
 */
router.put("/:id", protect, adminOnly, async (req, res) => {
  try {
    const { name, description } = req.body;
    const sharedContent = await SharedContent.findById(req.params.id);

    if (!sharedContent) {
      return res.status(404).json({ error: "Shared content not found" });
    }

    if (name !== undefined) sharedContent.name = name;
    if (description !== undefined) sharedContent.description = description;

    await sharedContent.save();
    res.json({ message: "Shared content updated successfully", sharedContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/shared-content/:id
 * Delete shared content (only if no courses are using it)
 */
router.delete("/:id", protect, adminOnly, async (req, res) => {
  try {
    const sharedContent = await SharedContent.findById(req.params.id);
    if (!sharedContent) {
      return res.status(404).json({ error: "Shared content not found" });
    }

    // Check if any courses are using this shared content
    const coursesUsingContent = await Course.countDocuments({ sharedContentId: req.params.id });
    
    if (coursesUsingContent > 0) {
      return res.status(400).json({ 
        error: `Cannot delete shared content. ${coursesUsingContent} course(s) are currently using it.`,
        courseCount: coursesUsingContent
      });
    }

    await SharedContent.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Shared content deleted successfully" });
  } catch (err) {
    console.error("delete-shared-content error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/shared-content/:id/courses
 * Get all courses using this shared content
 */
router.get("/:id/courses", protect, adminOnly, async (req, res) => {
  try {
    const courses = await Course.find({ sharedContentId: req.params.id })
      .select('title description price durationMonths isLive');
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
