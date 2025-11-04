const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const Course = require("../models/Course.js");
const router = express.Router();
const User = require("../models/userModel");


/**
 * POST /api/admin/courses
 * Create a new course
 *
 */

router.post("/courses", protect, adminOnly, async (req, res) => {
  try {
    const { title, description, durationMonths, weeks, price, thumbnail } = req.body;

    if (!title || !durationMonths || !weeks || !price) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newCourse = new Course({
      title,
      description,
      price,
      thumbnail: thumbnail || "", // store S3 key or URL
      weeks: [], // start empty
    });

    await newCourse.save();
    res.status(201).json(newCourse);
  } catch (err) {
    console.error("❌ Error creating course:", err);
    res.status(500).json({ error: "Failed to create course" });
  }
});

/**
 * GET /api/admin/courses
 * Fetch all courses
 */
router.get("/courses", protect, adminOnly, async (req, res) => {
  try {
    const courses = await Course.find();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/courses/:id
 * Fetch a single course
 */
router.get("/courses/:id", protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/courses/:id/weeks
 * Add a week to a course
 */
router.post("/courses/:id/weeks", protect, adminOnly, async (req, res) => {
  try {
    const { weekNumber, title } = req.body;
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Create a week with 7 days
    const days = [];
    for (let i = 1; i <= 7; i++) {
      days.push({
        dayNumber: i,
        title: `Day ${i}`,
        contents: []
      });
    }

    course.weeks.push({ weekNumber, title, days });
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/courses/:courseId/weeks/:weekId/days
 * Add a day to an existing week
 */
router.post("/courses/:courseId/weeks/:weekId/days", protect, adminOnly, async (req, res) => {
  try {
    const { courseId, weekId } = req.params;
    const { dayTitle } = req.body;

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const week = course.weeks.id(weekId);
    if (!week) return res.status(404).json({ error: "Week not found" });

    // Find the next day number for this week
    const maxDayNumber = week.days.length > 0
      ? Math.max(...week.days.map(day => day.dayNumber))
      : 0;
    const nextDayNumber = maxDayNumber + 1;

    // Add the new day
    week.days.push({
      dayNumber: nextDayNumber,
      title: dayTitle || `Day ${nextDayNumber}`,
      contents: []
    });

    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/courses/:courseId/weeks/:weekId/documents
 * Add document to module/week level
 */
router.post("/courses/:courseId/weeks/:weekId/documents", protect, adminOnly, async (req, res) => {
  try {
    const { type, title, s3Key } = req.body;
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const week = course.weeks.id(req.params.weekId);
    if (!week) return res.status(404).json({ error: "Week not found" });

    if (!week.documents) {
      week.documents = [];
    }

    week.documents.push({ type, title, s3Key });
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/courses/:courseId/weeks/:weekId/days/:dayId/contents
 * Add video/document to a specific day
 */
router.post("/courses/:courseId/weeks/:weekId/days/:dayId/contents", protect, adminOnly, async (req, res) => {
  try {
    const { type, title, s3Key } = req.body;
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const week = course.weeks.id(req.params.weekId);
    if (!week) return res.status(404).json({ error: "Week not found" });

    const day = week.days.id(req.params.dayId);
    if (!day) return res.status(404).json({ error: "Day not found" });

    day.contents.push({ type, title, s3Key });
    await course.save();
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/courses/:courseId/weeks/:weekId/days/:dayId/contents/:contentId
 * Delete content from a specific day
 */
router.delete("/courses/:courseId/weeks/:weekId/days/:dayId/contents/:contentId", protect, adminOnly, async (req, res) => {
  try {
    console.log(" Delete request received:", req.params); // 👈 Add this
    const { courseId, weekId, dayId, contentId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const week = course.weeks.id(weekId);
    if (!week) return res.status(404).json({ error: "Week not found" });

    const day = week.days.id(dayId);
    if (!day) return res.status(404).json({ error: "Day not found" });

    const content = day.contents.id(contentId);
    if (!content) return res.status(404).json({ error: "Content not found" });

    // Delete from S3 if s3 is available
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

    // Remove from DB
    content.deleteOne();
    await course.save();

    res.json({ success: true, message: "Content deleted" });
  } catch (err) {
    console.error("delete-content error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/courses/:courseId/weeks/:weekId
 * Delete an entire week
 */
router.delete("/courses/:courseId/weeks/:weekId", protect, adminOnly, async (req, res) => {
  try {
    const { courseId, weekId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const week = course.weeks.id(weekId);
    if (!week) return res.status(404).json({ error: "Week not found" });

    // Delete all content from S3 for this week
    try {
      const s3 = require("../config/s3");
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

      for (const day of week.days || []) {
        for (const content of day.contents || []) {
          if (content.s3Key) {
            const deleteParams = {
              Bucket: process.env.AWS_S3_BUCKET,
              Key: content.s3Key
            };
            await s3.send(new DeleteObjectCommand(deleteParams));
          }
        }
      }
    } catch (s3Error) {
      console.warn("Failed to delete some S3 content:", s3Error.message);
    }

    // Remove week from DB
    week.deleteOne();
    await course.save();

    res.json({ success: true, message: "Week deleted successfully" });
  } catch (err) {
    console.error("delete-week error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/courses/:courseId/weeks/:weekId/days/:dayId
 * Delete a specific day and all its content
 */
router.delete("/courses/:courseId/weeks/:weekId/days/:dayId", protect, adminOnly, async (req, res) => {
  try {
    const { courseId, weekId, dayId } = req.params;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const week = course.weeks.id(weekId);
    if (!week) return res.status(404).json({ error: "Week not found" });

    const day = week.days.id(dayId);
    if (!day) return res.status(404).json({ error: "Day not found" });

    // Delete all content from S3 for this day
    try {
      const s3 = require("../config/s3");
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

      for (const content of day.contents || []) {
        if (content.s3Key) {
          const deleteParams = {
            Bucket: process.env.AWS_S3_BUCKET,
            Key: content.s3Key
          };
          await s3.send(new DeleteObjectCommand(deleteParams));
        }
      }
    } catch (s3Error) {
      console.warn("Failed to delete some S3 content:", s3Error.message);
    }

    // Remove day from DB
    day.deleteOne();
    await course.save();

    res.json({ success: true, message: "Day deleted successfully" });
  } catch (err) {
    console.error("delete-day error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/courses/:courseId/weeks/:weekId/days/:dayId/contents/:contentId
 * Update content title
 */
router.put("/courses/:courseId/weeks/:weekId/days/:dayId/contents/:contentId", protect, adminOnly, async (req, res) => {
  try {
    const { courseId, weekId, dayId, contentId } = req.params;
    const { title } = req.body;

    if (!title) {
      return res.status(400).json({ error: "Title is required" });
    }

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const week = course.weeks.id(weekId);
    if (!week) return res.status(404).json({ error: "Week not found" });

    const day = week.days.id(dayId);
    if (!day) return res.status(404).json({ error: "Day not found" });

    const content = day.contents.id(contentId);
    if (!content) return res.status(404).json({ error: "Content not found" });

    content.title = title;
    await course.save();

    res.json({ message: "Content title updated successfully", content });
  } catch (err) {
    console.error("update-content-title error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PUT /api/admin/courses/:id
 * Update course details (title, description, price, thumbnail)
 */
router.put("/courses/:id", protect, adminOnly, async (req, res) => {
  try {
    const { title, description, price, thumbnail } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ error: "Course not found" });

    // Update fields
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (price !== undefined) course.price = price;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;

    await course.save();
    res.json({ message: "Course updated successfully", course });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * DELETE /api/admin/courses/:id
 * Delete entire course
 */
router.delete("/courses/:id", protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Delete all course content from S3
    try {
      const s3 = require("../config/s3");
      const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

      for (const week of course.weeks || []) {
        for (const day of week.days || []) {
          for (const content of day.contents || []) {
            if (content.s3Key) {
              const deleteParams = {
                Bucket: process.env.AWS_S3_BUCKET,
                Key: content.s3Key
              };
              await s3.send(new DeleteObjectCommand(deleteParams));
            }
          }
        }
      }

      // Delete thumbnail if exists
      if (course.thumbnail) {
        const deleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: course.thumbnail
        };
        await s3.send(new DeleteObjectCommand(deleteParams));
      }
    } catch (s3Error) {
      console.warn("Failed to delete some S3 content:", s3Error.message);
    }

    // Delete course from database
    await Course.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: "Course deleted successfully" });
  } catch (err) {
    console.error("delete-course error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/admin/courses/:id/toggle-live
 * Toggle course live status
 */
router.patch("/courses/:id/toggle-live", protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    course.isLive = !course.isLive;
    await course.save();

    res.json({
      message: `Course ${course.isLive ? 'is now live' : 'is no longer live'}`,
      course
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * (Optional) Old save-content
 * You can keep it if needed for backward compatibility,
 * but new recommended flow is /courses/:id/weeks/:weekId/contents
 */
// router.post("/save-content", ...);

/**
 * GET /api/admin/admindashboard
 */
router.get("/admindashboard", protect, adminOnly, async (req, res) => {
  try {
    const totalCourses = await Course.countDocuments();
    // you can also count users & enrollments if you have models
    res.json({
      message: "Admin dashboard",
      stats: {
        totalUsers: 0,
        totalCourses,
        totalEnrollments: 0,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching admin data", error: err.message });
  }
});


/**
 * GET /api/admin/dashboard/stats
 * Get real dashboard statistics (with detailed logging)
 */
router.get("/dashboard/stats", protect, adminOnly, async (req, res) => {
  // console.log("📊 [Dashboard] API hit received from admin:", req.user?.email || "unknown");

  try {
    // console.log("➡️ Fetching total course count...");
    const totalCourses = await Course.countDocuments({});
    // console.log("✅ Total courses:", totalCourses);

    // console.log("➡️ Fetching total student count...");
    const totalStudents = await User.countDocuments({ role: { $ne: 'admin' } });
    // console.log("✅ Total students:", totalStudents);

    // console.log("➡️ Calculating total enrollments...");
    const enrollmentData = await User.aggregate([
      { $match: { role: { $ne: 'admin' }, purchasedCourses: { $exists: true, $ne: [] } } },
      { $unwind: "$purchasedCourses" },
      { $group: { _id: null, totalEnrollments: { $sum: 1 } } }
    ]);
    const totalEnrollments = enrollmentData.length > 0 ? enrollmentData[0].totalEnrollments : 0;
    // console.log("✅ Total enrollments:", totalEnrollments);

    // console.log("➡️ Fetching recent students...");
    const recentStudents = await User.find({ role: { $ne: 'admin' } })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name email createdAt');
    // console.log("✅ Recent students fetched:", recentStudents.length);

    // console.log("➡️ Fetching top enrolled courses...");
    const topCourses = await Course.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: 'purchasedCourses',
          as: 'enrollments'
        }
      },
      {
        $project: {
          title: 1,
          studentCount: { $size: '$enrollments' }
        }
      },
      { $sort: { studentCount: -1 } },
      { $limit: 5 }
    ]);
    // console.log("✅ Top courses fetched:", topCourses.length);

    // console.log("➡️ Calculating mock revenue data...");
    const revenue = totalEnrollments * 15000; // Example static pricing
    // console.log("✅ Estimated revenue: ₹" + revenue.toLocaleString());

    // console.log("➡️ Generating enrollment trend (mock)...");
    const enrollmentTrend = [
      { month: "Jan", enrollments: Math.floor(totalEnrollments * 0.1) },
      { month: "Feb", enrollments: Math.floor(totalEnrollments * 0.15) },
      { month: "Mar", enrollments: Math.floor(totalEnrollments * 0.2) },
      { month: "Apr", enrollments: Math.floor(totalEnrollments * 0.25) },
      { month: "May", enrollments: Math.floor(totalEnrollments * 0.3) },
    ];
    // console.log("✅ Enrollment trend ready");

    const revenueTrend = enrollmentTrend.map(item => ({
      month: item.month,
      revenue: item.enrollments * 15000
    }));

    // console.log("✅ Revenue trend ready. Sending response...");

    res.json({
      stats: [
        { label: "Total Courses", value: totalCourses },
        { label: "Total Students", value: totalStudents },
        { label: "Active Enrollments", value: totalEnrollments },
        { label: "Revenue (₹)", value: revenue.toLocaleString() },
      ],
      enrollmentTrend,
      revenueTrend,
      topCourses: topCourses.map(course => ({
        title: course.title,
        students: course.studentCount
      })),
      recentStudents: recentStudents.map(student => ({
        name: student.name,
        course: "Course Access", // placeholder
        date: student.createdAt.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short'
        })
      }))
    });

    // console.log("✅ [Dashboard] Data sent successfully.\n");
  } catch (err) {
    // console.error("❌ Error fetching dashboard stats:", err);
    res.status(500).json({ error: "Failed to fetch dashboard statistics", details: err.message });
  }
});

/**
 * GET /api/admin/documents
 * Fetch all uploaded documents (from anywhere)
 */
router.get("/documents", protect, adminOnly, async (req, res) => {
  try {
    const docs = await Document.find({ isActive: true })
      .populate("uploadedBy", "name email")
      .sort({ createdAt: -1 });

    console.log(`📂 Admin fetched ${docs.length} documents`);
    res.status(200).json(docs);
  } catch (err) {
    console.error("❌ Error fetching documents:", err.message);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

/**
 * DELETE /api/admin/documents/:id
 * Delete a document from S3 + DB
 */
router.delete("/documents/:id", protect, adminOnly, async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id);
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const deleteParams = {
      Bucket: process.env.AWS_S3_BUCKET,
      Key: doc.s3Key,
    };

    await s3.send(new DeleteObjectCommand(deleteParams));
    await doc.deleteOne();

    console.log(`🗑️ Deleted document: ${doc.title}`);
    res.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    console.error("❌ Delete document error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
