const express = require('express');
const { protect } = require("../middleware/authMiddleware");
const Course = require("../models/Course");
const User = require("../models/userModel");
const { updateProfile } = require("../controllers/authcontroller");
const router = express.Router();

/**
 * GET /api/user/courses/live
 * Get all live courses (public route)
 */
router.get('/courses/live', async (req, res) => {
  try {
    const liveCourses = await Course.find({ isLive: true }).select('-weeks');
    res.json(liveCourses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/user/courses/:id
 * Get full course details including weeks and content (for enrolled students only)
 */
router.get('/courses/:id', protect, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
    
    // Check if user has purchased this course
    const user = await User.findById(req.user.id);
    const hasPurchased = user.purchasedCourses.includes(req.params.id);
    
    if (!hasPurchased) {
      return res.status(403).json({ 
        error: 'Access denied. You need to purchase this course to view its content.' 
      });
    }
    
    // Return full course data if user has purchased it
    res.json(course);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/user/purchased-courses
 * Get courses purchased by the authenticated user
 */
router.get('/purchased-courses', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('purchasedCourses');
    res.json(user.purchasedCourses || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// only admin can access this route  
router.get('/admin', protect, (req, res) => {
    res.status(200).json({ message: 'Welcome Admin' });
});

// only manager can access this route  


// only user can access this route  
router.get('/user', protect, (req, res) => {
    res.status(200).json({ message: 'Welcome User' });
});

/**
 * PUT /api/user/profile
 * Update user profile (name, email)
 */
router.put('/profile', protect, updateProfile);

/**
 * GET /api/user/streak
 * Get user streak data
 */
router.get('/streak', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('streak');
    
    // Calculate if streak should be reset due to missed days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let currentStreak = user.streak?.current || 0;
    const lastLoginDate = user.streak?.lastLoginDate;
    
    if (lastLoginDate && currentStreak > 0) {
      const lastLogin = new Date(lastLoginDate);
      lastLogin.setHours(0, 0, 0, 0);
      
      const daysDiff = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 1) {
        // More than 1 day gap, reset current streak but keep highest
        currentStreak = 0;
        user.streak.current = 0;
        await user.save();
      }
    }
    
    res.json({
      current: currentStreak,
      highest: user.streak?.highest || 0,
      lastLoginDate: user.streak?.lastLoginDate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/user/video-progress
 * Update video watching progress
 */
router.post('/video-progress', protect, async (req, res) => {
  try {
    const { courseId, weekId, dayId, contentId, videoTitle, progress, watchTime, totalDuration } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Find existing video progress or create new
    let videoProgressIndex = user.videoProgress.findIndex(vp => 
      vp.courseId.toString() === courseId && 
      vp.contentId.toString() === contentId
    );
    
    const videoProgressData = {
      courseId,
      weekId,
      dayId,
      contentId,
      videoTitle,
      progress: Math.min(Math.max(progress, 0), 1), // Ensure between 0 and 1
      watchTime,
      totalDuration,
      completed: progress >= 0.9, // Consider 90%+ as completed
      lastWatchedAt: new Date()
    };
    
    if (videoProgressIndex >= 0) {
      // Update existing progress
      user.videoProgress[videoProgressIndex] = {
        ...user.videoProgress[videoProgressIndex].toObject(),
        ...videoProgressData
      };
    } else {
      // Add new video progress
      videoProgressData.firstWatchedAt = new Date();
      user.videoProgress.push(videoProgressData);
    }
    
    // Update course progress summary
    await updateCourseProgress(user, courseId);
    await user.save();
    
    res.json({ message: 'Video progress updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/user/progress-dashboard
 * Get comprehensive progress data for dashboard
 */
router.get('/progress-dashboard', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).populate('purchasedCourses');
    
    // Calculate overall statistics
    let totalVideosCompleted = 0;
    let totalWatchedMinutes = 0;
    let totalVideos = 0;
    let totalEstimatedMinutes = 0;
    let overallProgress = 0;
    
    // Get recent activity (last 10 videos watched)
    const recentActivity = user.videoProgress
      .sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt))
      .slice(0, 10)
      .map(vp => ({
        id: vp._id,
        videoTitle: vp.videoTitle,
        courseTitle: user.purchasedCourses.find(c => c._id.toString() === vp.courseId.toString())?.title || 'Unknown Course',
        progress: vp.progress,
        duration: vp.totalDuration ? `${Math.ceil(vp.totalDuration / 60)}min` : null,
        lastWatchedAt: vp.lastWatchedAt
      }));
    
    // Calculate weekly watch time (last 7 days)
    const weeklyWatchTime = [];
    const today = new Date();
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      
      const dayWatchTime = user.videoProgress
        .filter(vp => {
          const watchDate = new Date(vp.lastWatchedAt);
          return watchDate >= date && watchDate < nextDay;
        })
        .reduce((total, vp) => total + (vp.watchTime || 0), 0);
      
      weeklyWatchTime.push(Math.round(dayWatchTime / 3600 * 10) / 10); // Convert to hours with 1 decimal
    }
    
    // Calculate course progress
    for (const course of user.purchasedCourses) {
      const courseVideos = [];
      
      // Count all videos in the course
      if (course.weeks) {
        for (const week of course.weeks) {
          if (week.days) {
            for (const day of week.days) {
              if (day.contents) {
                const videos = day.contents.filter(content => content.type === 'video');
                courseVideos.push(...videos);
              }
            }
          }
        }
      }
      
      totalVideos += courseVideos.length;
      
      // Calculate completed videos for this course
      const courseVideoProgress = user.videoProgress.filter(vp => 
        vp.courseId.toString() === course._id.toString()
      );
      
      const completedInCourse = courseVideoProgress.filter(vp => vp.completed).length;
      totalVideosCompleted += completedInCourse;
      
      // Sum watch time for this course
      const courseWatchTime = courseVideoProgress.reduce((total, vp) => 
        total + (vp.watchTime || 0), 0
      );
      totalWatchedMinutes += courseWatchTime;
      
      // Estimate total duration (assuming 10 minutes per video if not specified)
      const courseTotalMinutes = courseVideos.reduce((total, video) => 
        total + (video.duration || 600), 0 // 600 seconds = 10 minutes default
      );
      totalEstimatedMinutes += courseTotalMinutes;
    }
    
    // Calculate overall progress
    if (totalVideos > 0) {
      overallProgress = Math.round((totalVideosCompleted / totalVideos) * 100);
    }
    
    const totalWatchedHours = Math.round(totalWatchedMinutes / 3600 * 10) / 10;
    const remainingHours = Math.max(0, Math.round((totalEstimatedMinutes - totalWatchedMinutes) / 3600 * 10) / 10);
    
    res.json({
      totalProgress: overallProgress,
      totalWatchedHours,
      totalVideosCompleted,
      remainingHours,
      weeklyWatchTime,
      recentActivity,
      totalVideos,
      totalCourses: user.purchasedCourses.length
    });
  } catch (err) {
    console.error('Progress dashboard error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Helper function to update course progress
async function updateCourseProgress(user, courseId) {
  try {
    const courseVideos = user.videoProgress.filter(vp => 
      vp.courseId.toString() === courseId.toString()
    );
    
    const completedVideos = courseVideos.filter(vp => vp.completed).length;
    const totalWatchTime = courseVideos.reduce((total, vp) => 
      total + (vp.watchTime || 0), 0
    ) / 3600; // Convert to hours
    
    // Get total videos count from course
    const Course = require("../models/Course");
    const course = await Course.findById(courseId);
    let totalVideosInCourse = 0;
    
    if (course && course.weeks) {
      for (const week of course.weeks) {
        if (week.days) {
          for (const day of week.days) {
            if (day.contents) {
              totalVideosInCourse += day.contents.filter(content => content.type === 'video').length;
            }
          }
        }
      }
    }
    
    const overallProgress = totalVideosInCourse > 0 ? completedVideos / totalVideosInCourse : 0;
    
    // Update or create course progress
    let courseProgressIndex = user.courseProgress.findIndex(cp => 
      cp.courseId.toString() === courseId.toString()
    );
    
    const courseProgressData = {
      courseId,
      totalVideos: totalVideosInCourse,
      completedVideos,
      totalWatchTime,
      overallProgress,
      lastAccessedAt: new Date()
    };
    
    if (courseProgressIndex >= 0) {
      user.courseProgress[courseProgressIndex] = {
        ...user.courseProgress[courseProgressIndex].toObject(),
        ...courseProgressData
      };
    } else {
      courseProgressData.enrolledAt = new Date();
      user.courseProgress.push(courseProgressData);
    }
  } catch (err) {
    console.error('Error updating course progress:', err);
  }
}

module.exports = router;
