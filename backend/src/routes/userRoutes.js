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

module.exports = router;
