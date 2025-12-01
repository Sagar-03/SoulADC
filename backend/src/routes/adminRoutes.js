const express = require("express");
const { protect, adminOnly } = require("../middleware/authMiddleware");
const Course = require("../models/Course.js");
const Mock = require("../models/Mock.js");
const router = express.Router();
const User = require("../models/userModel");


/**
 * POST /api/admin/courses
 * Create a new course
 *
 */

router.post("/courses", protect, adminOnly, async (req, res) => {
  try {
    const { title, description, durationMonths, weeks, price, cutPrice, thumbnail, sharedContentId } = req.body;

    if (!title || !durationMonths || !price) {
      return res.status(400).json({ error: "Missing required fields: title, durationMonths, and price are required" });
    }

    if (durationMonths < 1) {
      return res.status(400).json({ error: "Duration must be at least 1 month" });
    }

    const newCourse = new Course({
      title,
      description,
      durationMonths: parseInt(durationMonths),
      price,
      cutPrice: cutPrice || null, // Optional cut price
      thumbnail: thumbnail || "", // store S3 key or URL
      weeks: [], // start empty (used if not using shared content)
      sharedContentId: sharedContentId || null, // Link to shared content if provided
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
 * Fetch all courses with shared content info and weeks
 */
router.get("/courses", protect, adminOnly, async (req, res) => {
  try {
    const courses = await Course.find().populate('sharedContentId');
    
    // Transform courses to include weeks from shared content if needed
    const coursesWithContent = courses.map(course => {
      const courseObj = course.toObject();
      
      // If course uses shared content, include weeks from it
      if (course.sharedContentId && course.sharedContentId.weeks) {
        courseObj.weeks = course.sharedContentId.weeks;
        courseObj.sharedContent = {
          _id: course.sharedContentId._id,
          name: course.sharedContentId.name,
          description: course.sharedContentId.description
        };
      }
      
      return courseObj;
    });
    
    res.json({ courses: coursesWithContent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/courses/:id
 * Fetch a single course with its content (direct or shared)
 */
router.get("/courses/:id", protect, adminOnly, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('sharedContentId');
    if (!course) return res.status(404).json({ error: "Course not found" });
    
    // If course uses shared content, merge it with course data
    if (course.sharedContentId) {
      const courseObj = course.toObject();
      courseObj.weeks = course.sharedContentId.weeks; // Use shared content weeks
      courseObj.sharedContent = {
        _id: course.sharedContentId._id,
        name: course.sharedContentId.name,
        description: course.sharedContentId.description
      };
      return res.json(courseObj);
    }
    
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
 * Add document to module/week level (supports both direct and shared content)
 */
router.post("/courses/:courseId/weeks/:weekId/documents", protect, adminOnly, async (req, res) => {
  try {
    const { type, title, s3Key } = req.body;
    console.log(`📄 Adding document to week: courseId=${req.params.courseId}, weekId=${req.params.weekId}`);
    console.log(`📦 Document data: type="${type}", title="${title}", s3Key="${s3Key}"`);
    
    const course = await Course.findById(req.params.courseId).populate('sharedContentId');
    if (!course) return res.status(404).json({ error: "Course not found" });

    // Check if course uses shared content
    if (course.sharedContentId && course.sharedContentId.weeks) {
      const SharedContent = require("../models/SharedContent");
      const sharedContent = await SharedContent.findById(course.sharedContentId._id);
      
      if (!sharedContent) {
        return res.status(404).json({ error: "SharedContent not found" });
      }

      const week = sharedContent.weeks.id(req.params.weekId);
      if (!week) return res.status(404).json({ error: "Week not found in SharedContent" });

      if (!week.documents) {
        week.documents = [];
      }

      week.documents.push({ type, title, s3Key });
      await sharedContent.save();
      
      // Fetch the saved document to get its auto-generated _id
      const updatedSharedContent = await SharedContent.findById(course.sharedContentId._id);
      const updatedWeek = updatedSharedContent.weeks.id(req.params.weekId);
      const savedDoc = updatedWeek.documents[updatedWeek.documents.length - 1];
      
      console.log(`✅ Document "${title}" added to SharedContent week ${week.weekNumber}`);
      console.log(`📌 New document ID: ${savedDoc._id}, s3Key: ${savedDoc.s3Key}`);
      res.json({ success: true, message: "Document added to SharedContent", document: savedDoc });
    } else {
      // Course has direct content
      const week = course.weeks.id(req.params.weekId);
      if (!week) return res.status(404).json({ error: "Week not found" });

      if (!week.documents) {
        week.documents = [];
      }

      const newDoc = { type, title, s3Key };
      week.documents.push(newDoc);
      await course.save();
      
      // Fetch the saved document to get its auto-generated _id
      const savedCourse = await Course.findById(req.params.courseId);
      const savedWeek = savedCourse.weeks.id(req.params.weekId);
      const savedDoc = savedWeek.documents[savedWeek.documents.length - 1];
      
      console.log(`✅ Document "${title}" added to Course week ${week.weekNumber}`);
      console.log(`📌 New document ID: ${savedDoc._id}, s3Key: ${savedDoc.s3Key}`);
      res.json({ success: true, message: "Document added to Course", document: savedDoc, course });
    }
  } catch (err) {
    console.error("❌ Error adding week document:", err);
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
 * Update course details (title, description, price, thumbnail, durationMonths)
 */
router.put("/courses/:id", protect, adminOnly, async (req, res) => {
  try {
    const { title, description, price, cutPrice, thumbnail, durationMonths } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ error: "Course not found" });

    // Update fields
    if (title !== undefined) course.title = title;
    if (description !== undefined) course.description = description;
    if (price !== undefined) course.price = price;
    if (cutPrice !== undefined) course.cutPrice = cutPrice;
    if (thumbnail !== undefined) course.thumbnail = thumbnail;
    if (durationMonths !== undefined) {
      if (durationMonths < 1) {
        return res.status(400).json({ error: "Duration must be at least 1 month" });
      }
      course.durationMonths = parseInt(durationMonths);
    }

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
 * Fetch all uploaded documents (from courses and shared content)
 */
router.get("/documents", protect, adminOnly, async (req, res) => {
  try {
    const courses = await Course.find({}).populate('sharedContentId');
    const allDocuments = [];

    courses.forEach(course => {
      // Determine which weeks to use (direct or from shared content)
      let weeks = [];
      
      if (course.sharedContentId && course.sharedContentId.weeks) {
        // Course uses shared content
        weeks = course.sharedContentId.weeks;
      } else if (course.weeks) {
        // Course has direct content
        weeks = course.weeks;
      }

      // Get week-level documents
      weeks.forEach(week => {
        if (week.documents && week.documents.length > 0) {
          week.documents.forEach(doc => {
            allDocuments.push({
              _id: doc._id,
              title: doc.title,
              type: doc.type,
              s3Key: doc.s3Key,
              url: doc.s3Key ? `/api/stream/${doc.s3Key}` : null,
              createdAt: doc._id.getTimestamp(), // Get timestamp from ObjectId
              uploadedBy: { name: "Admin" }, // Since we don't have user info
              courseTitle: course.title,
              weekTitle: week.title,
              weekNumber: week.weekNumber,
              source: 'week',
              isSharedContent: !!course.sharedContentId
            });
          });
        }

        // Get day-level contents (documents)
        if (week.days) {
          week.days.forEach(day => {
            if (day.contents && day.contents.length > 0) {
              day.contents.forEach(content => {
                if (content.type === 'document' || content.type === 'pdf') {
                  allDocuments.push({
                    _id: content._id,
                    title: content.title,
                    type: content.type,
                    s3Key: content.s3Key,
                    url: content.s3Key ? `/api/stream/${content.s3Key}` : null,
                    createdAt: content._id.getTimestamp(), // Get timestamp from ObjectId
                    uploadedBy: { name: "Admin" }, // Since we don't have user info
                    courseTitle: course.title,
                    weekTitle: week.title,
                    weekNumber: week.weekNumber,
                    dayTitle: day.title,
                    dayNumber: day.dayNumber,
                    source: 'day',
                    isSharedContent: !!course.sharedContentId
                  });
                }
              });
            }
          });
        }
      });
    });

    // Sort by creation date (newest first)
    allDocuments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    console.log(`📂 Admin fetched ${allDocuments.length} documents`);
    res.status(200).json(allDocuments);
  } catch (err) {
    console.error("❌ Error fetching documents:", err.message);
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

/**
 * DELETE /api/admin/documents/:id
 * Delete a document from S3 + DB (from courses)
 */
router.delete("/documents/:id", protect, adminOnly, async (req, res) => {
  try {
    const documentId = req.params.id;
    let documentFound = false;
    let documentToDelete = null;

    console.log(`🔍 Searching for document ID: ${documentId}`);

    // Find the document in courses
    const courses = await Course.find({}).populate('sharedContentId');
    
    for (const course of courses) {
      console.log(`📚 Checking course: ${course.title}`);
      
      // Determine which weeks to use (direct or from shared content)
      let weeks = [];
      if (course.sharedContentId && course.sharedContentId.weeks) {
        console.log(`  Using shared content weeks`);
        weeks = course.sharedContentId.weeks;
      } else if (course.weeks) {
        console.log(`  Using direct course weeks`);
        weeks = course.weeks;
      }

      for (const week of weeks) {
        // Check week-level documents
        if (week.documents && week.documents.length > 0) {
          const docIndex = week.documents.findIndex(doc => doc._id.toString() === documentId);
          if (docIndex !== -1) {
            documentToDelete = week.documents[docIndex];
            week.documents.splice(docIndex, 1);
            
            // Save to the appropriate model
            if (course.sharedContentId && course.sharedContentId.weeks) {
              const SharedContent = require("../models/SharedContent");
              await SharedContent.findByIdAndUpdate(course.sharedContentId._id, {
                weeks: course.sharedContentId.weeks
              });
              console.log(`✅ Found and deleted from SharedContent week ${week.weekNumber}`);
            } else {
              await course.save();
              console.log(`✅ Found and deleted from Course week ${week.weekNumber}`);
            }
            documentFound = true;
            break;
          }
        }

        // Check day-level contents
        if (!documentFound && week.days && week.days.length > 0) {
          for (const day of week.days) {
            if (day.contents && day.contents.length > 0) {
              const contentIndex = day.contents.findIndex(content => 
                content._id.toString() === documentId && 
                (content.type === 'document' || content.type === 'pdf')
              );
              if (contentIndex !== -1) {
                documentToDelete = day.contents[contentIndex];
                day.contents.splice(contentIndex, 1);
                
                // Save to the appropriate model
                if (course.sharedContentId && course.sharedContentId.weeks) {
                  const SharedContent = require("../models/SharedContent");
                  await SharedContent.findByIdAndUpdate(course.sharedContentId._id, {
                    weeks: course.sharedContentId.weeks
                  });
                  console.log(`✅ Found and deleted from SharedContent day ${day.dayNumber}`);
                } else {
                  await course.save();
                  console.log(`✅ Found and deleted from Course day ${day.dayNumber}`);
                }
                documentFound = true;
                break;
              }
            }
          }
        }
        
        if (documentFound) break;
      }
      if (documentFound) break;
    }

    if (!documentFound) {
      console.error(`❌ Document ${documentId} not found in any course`);
      return res.status(404).json({ 
        error: "Document not found in database",
        documentId: documentId,
        suggestion: "The document may have already been deleted or the ID is incorrect"
      });
    }

    // Delete from S3 if s3Key exists
    if (documentToDelete.s3Key) {
      try {
        const s3 = require("../config/s3");
        const { DeleteObjectCommand } = require("@aws-sdk/client-s3");

        const deleteParams = {
          Bucket: process.env.AWS_S3_BUCKET,
          Key: documentToDelete.s3Key,
        };

        await s3.send(new DeleteObjectCommand(deleteParams));
        console.log(`🗑️ Deleted from S3: ${documentToDelete.s3Key}`);
      } catch (s3Error) {
        console.error("❌ S3 delete error:", s3Error.message);
        // Continue even if S3 delete fails
      }
    }

    console.log(`🗑️ Deleted document: ${documentToDelete.title}`);
    res.json({ success: true, message: "Document deleted successfully" });
  } catch (err) {
    console.error("❌ Delete document error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/admin/documents/cleanup-orphaned
 * Remove all document entries that don't have valid S3 files
 */
router.post("/documents/cleanup-orphaned", protect, adminOnly, async (req, res) => {
  try {
    const s3 = require("../config/s3");
    const { HeadObjectCommand } = require("@aws-sdk/client-s3");
    const SharedContent = require("../models/SharedContent");
    
    let totalChecked = 0;
    let totalRemoved = 0;
    const removedDocs = [];

    console.log("🧹 Starting orphaned documents cleanup...");

    const courses = await Course.find({}).populate('sharedContentId');
    
    for (const course of courses) {
      let courseModified = false;
      let sharedContentModified = false;
      
      // Determine which weeks to use
      let weeks = [];
      let isSharedContent = false;
      
      if (course.sharedContentId && course.sharedContentId.weeks) {
        weeks = course.sharedContentId.weeks;
        isSharedContent = true;
      } else if (course.weeks) {
        weeks = course.weeks;
      }

      for (const week of weeks) {
        // Check week-level documents
        if (week.documents && week.documents.length > 0) {
          const validDocs = [];
          
          for (const doc of week.documents) {
            totalChecked++;
            
            if (doc.s3Key) {
              try {
                await s3.send(new HeadObjectCommand({
                  Bucket: process.env.AWS_S3_BUCKET,
                  Key: doc.s3Key,
                }));
                // File exists, keep it
                validDocs.push(doc);
              } catch (s3Error) {
                // File doesn't exist in S3, mark for removal
                console.log(`❌ Orphaned document found: ${doc.title} (${doc.s3Key})`);
                totalRemoved++;
                removedDocs.push({
                  title: doc.title,
                  s3Key: doc.s3Key,
                  course: course.title,
                  week: week.weekNumber
                });
                if (isSharedContent) {
                  sharedContentModified = true;
                } else {
                  courseModified = true;
                }
              }
            } else {
              // No s3Key, remove it
              console.log(`❌ Document with no s3Key: ${doc.title}`);
              totalRemoved++;
              removedDocs.push({
                title: doc.title,
                s3Key: 'none',
                course: course.title,
                week: week.weekNumber
              });
              if (isSharedContent) {
                sharedContentModified = true;
              } else {
                courseModified = true;
              }
            }
          }
          
          week.documents = validDocs;
        }

        // Check day-level contents
        if (week.days && week.days.length > 0) {
          for (const day of week.days) {
            if (day.contents && day.contents.length > 0) {
              const validContents = [];
              
              for (const content of day.contents) {
                if (content.type === 'document' || content.type === 'pdf') {
                  totalChecked++;
                  
                  if (content.s3Key) {
                    try {
                      await s3.send(new HeadObjectCommand({
                        Bucket: process.env.AWS_S3_BUCKET,
                        Key: content.s3Key,
                      }));
                      // File exists, keep it
                      validContents.push(content);
                    } catch (s3Error) {
                      // File doesn't exist in S3, mark for removal
                      console.log(`❌ Orphaned content found: ${content.title} (${content.s3Key})`);
                      totalRemoved++;
                      removedDocs.push({
                        title: content.title,
                        s3Key: content.s3Key,
                        course: course.title,
                        week: week.weekNumber,
                        day: day.dayNumber
                      });
                      if (isSharedContent) {
                        sharedContentModified = true;
                      } else {
                        courseModified = true;
                      }
                    }
                  } else {
                    validContents.push(content);
                  }
                } else {
                  validContents.push(content);
                }
              }
              
              day.contents = validContents;
            }
          }
        }
      }

      // Save changes
      if (sharedContentModified) {
        await SharedContent.findByIdAndUpdate(course.sharedContentId._id, {
          weeks: course.sharedContentId.weeks
        });
        console.log(`✅ Updated SharedContent: ${course.title}`);
      } else if (courseModified) {
        await course.save();
        console.log(`✅ Updated Course: ${course.title}`);
      }
    }

    console.log(`🧹 Cleanup complete: ${totalRemoved}/${totalChecked} documents removed`);
    
    res.json({
      success: true,
      message: `Cleanup completed successfully`,
      stats: {
        totalChecked,
        totalRemoved,
        removedDocuments: removedDocs
      }
    });
  } catch (err) {
    console.error("❌ Cleanup error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/admin/users
 * Fetch all users (excluding admins)
 */
router.get("/users", protect, adminOnly, async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: 'admin' } })
      .populate('purchasedCourses', 'title')
      .select('-password -resetToken -resetTokenExpire -activeSession')
      .sort({ createdAt: -1 });

    const formattedUsers = users.map(user => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      purchasedCourses: user.purchasedCourses.map(course => course.title),
      createdAt: user.createdAt,
      streak: user.streak?.current || 0,
    }));

    console.log(` Admin fetched ${formattedUsers.length} users`);
    res.json(formattedUsers);
  } catch (err) {
    console.error(" Error fetching users:", err.message);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

/**
 * DELETE /api/admin/users/:id
 * Delete a user (cannot delete admins)
 */
router.delete("/users/:id", protect, adminOnly, async (req, res) => {
  try {
    const userId = req.params.id;
    
    // Find the user
    const user = await User.findById(userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Prevent deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({ error: "Cannot delete admin users" });
    }

    // Delete the user
    await User.findByIdAndDelete(userId);
    
    console.log(` Deleted user: ${user.name} (${user.email})`);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    console.error(" Error deleting user:", err.message);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

/**
 * GET /api/admin/pending-approvals
 * Fetch all pending payment approvals with complete student data (courses and mocks)
 */
router.get("/pending-approvals", protect, adminOnly, async (req, res) => {
  try {
    const usersWithPendingApprovals = await User.find({
      'pendingApprovals': { $exists: true, $ne: [] }
    })
    .populate('pendingApprovals.courseId', 'title price')
    .populate('pendingApprovals.mockId', 'title price')
    .select('name email phone countryCode pendingApprovals')
    .sort({ 'pendingApprovals.paymentDate': -1 });

    // Flatten and format the data
    const approvals = [];
    usersWithPendingApprovals.forEach(user => {
      user.pendingApprovals.forEach(approval => {
        if (approval.status === 'pending') {
          const itemData = approval.itemType === 'mock' 
            ? { 
                id: approval.mockId?._id, 
                title: approval.mockId?.title, 
                price: approval.mockId?.price 
              }
            : { 
                id: approval.courseId?._id, 
                title: approval.courseId?.title, 
                price: approval.courseId?.price 
              };

          approvals.push({
            approvalId: approval._id,
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            userPhone: user.phone ? `${user.countryCode || ''} ${user.phone}` : 'N/A',
            itemType: approval.itemType || 'course',
            itemId: itemData.id,
            itemTitle: itemData.title,
            itemPrice: itemData.price,
            paymentAmount: approval.paymentAmount,
            paymentDate: approval.paymentDate,
            paymentSessionId: approval.paymentSessionId,
            status: approval.status
          });
        }
      });
    });

    console.log(`📋 Fetched ${approvals.length} pending approvals`);
    res.json(approvals);
  } catch (err) {
    console.error("❌ Error fetching pending approvals:", err.message);
    res.status(500).json({ error: "Failed to fetch pending approvals" });
  }
});

/**
 * POST /api/admin/approve-payment/:userId/:approvalId
 * Approve a pending payment and grant course/mock access
 */
router.post("/approve-payment/:userId/:approvalId", protect, adminOnly, async (req, res) => {
  try {
    const { userId, approvalId } = req.params;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const approval = user.pendingApprovals.id(approvalId);
    if (!approval) {
      return res.status(404).json({ error: "Approval request not found" });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ error: "This approval has already been processed" });
    }

    let itemTitle = '';
    let notificationType = '';
    let notificationMessage = '';

    if (approval.itemType === 'mock') {
      // Handle mock approval
      const mock = await Mock.findById(approval.mockId);
      if (!mock) {
        return res.status(404).json({ error: "Mock not found" });
      }

      itemTitle = mock.title;

      // Check if user already has this mock
      const existingMock = user.purchasedMocks.find(
        pm => pm.mockId.toString() === approval.mockId.toString()
      );

      if (!existingMock) {
        // Grant mock access
        user.purchasedMocks.push({
          mockId: approval.mockId,
          purchaseDate: approval.paymentDate,
          paymentAmount: approval.paymentAmount
        });
      }

      notificationType = 'mock_approved';
      notificationMessage = `Your access to mock "${mock.title}" has been approved! You can now attempt this mock exam.`;
    } else {
      // Handle course approval
      const course = await Course.findById(approval.courseId);
      if (!course) {
        return res.status(404).json({ error: "Course not found" });
      }

      itemTitle = course.title;

      // Calculate expiry date
      const purchaseDate = approval.paymentDate;
      const expiryDate = new Date(purchaseDate);
      expiryDate.setMonth(expiryDate.getMonth() + course.durationMonths);

      // Check if user already has this course
      const existingCourse = user.purchasedCourses.find(
        pc => pc.courseId.toString() === approval.courseId.toString()
      );

      if (!existingCourse) {
        // Grant course access
        user.purchasedCourses.push({
          courseId: approval.courseId,
          purchaseDate: purchaseDate,
          expiryDate: expiryDate,
          isExpired: false
        });
      }

      notificationType = 'course_approved';
      notificationMessage = `Your access to "${course.title}" has been approved! You can now access your course content.`;
    }

    // Update approval status
    approval.status = 'approved';
    approval.approvedBy = req.user.id;
    approval.approvedAt = new Date();

    // Create notification for the student
    user.notifications.push({
      type: notificationType,
      courseId: approval.courseId || null,
      mockId: approval.mockId || null,
      message: notificationMessage,
      isRead: false,
      createdAt: new Date()
    });

    await user.save();

    console.log(`✅ Admin ${req.user.email} approved payment for user ${user.email}, ${approval.itemType}: ${itemTitle}`);
    res.json({ 
      success: true, 
      message: `Payment approved and ${approval.itemType} access granted`,
      itemTitle: itemTitle,
      userName: user.name
    });
  } catch (err) {
    console.error("❌ Error approving payment:", err.message);
    res.status(500).json({ error: "Failed to approve payment" });
  }
});

/**
 * POST /api/admin/reject-payment/:userId/:approvalId
 * Reject a pending payment request
 */
router.post("/reject-payment/:userId/:approvalId", protect, adminOnly, async (req, res) => {
  try {
    const { userId, approvalId } = req.params;
    const { reason } = req.body;
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const approval = user.pendingApprovals.id(approvalId);
    if (!approval) {
      return res.status(404).json({ error: "Approval request not found" });
    }

    if (approval.status !== 'pending') {
      return res.status(400).json({ error: "This approval has already been processed" });
    }

    // Update approval status
    approval.status = 'rejected';
    approval.approvedBy = req.user.id;
    approval.approvedAt = new Date();
    approval.rejectionReason = reason || 'No reason provided';

    await user.save();

    console.log(`❌ Admin ${req.user.email} rejected payment for user ${user.email}`);
    res.json({ 
      success: true, 
      message: "Payment rejected",
      userName: user.name
    });
  } catch (err) {
    console.error("❌ Error rejecting payment:", err.message);
    res.status(500).json({ error: "Failed to reject payment" });
  }
});

module.exports = router;
