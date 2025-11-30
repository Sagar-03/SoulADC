const User = require("../models/userModel");

/**
 * Middleware to check if user has valid access to a course
 * Checks both if course is purchased and if it hasn't expired
 */
const checkCourseAccess = async (req, res, next) => {
  try {
    const courseId = req.params.id || req.params.courseId;
    const userId = req.user.id;

    if (!courseId) {
      return res.status(400).json({ error: "Course ID is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Find the purchased course entry
    const purchasedCourse = user.purchasedCourses.find(
      (pc) => pc.courseId.toString() === courseId.toString()
    );

    if (!purchasedCourse) {
      return res.status(403).json({
        error: "Access denied. You need to purchase this course to view its content.",
        hasAccess: false,
        reason: "not_purchased"
      });
    }

    // Check if course has expired
    const now = new Date();
    if (purchasedCourse.expiryDate < now) {
      // Mark as expired if not already
      if (!purchasedCourse.isExpired) {
        purchasedCourse.isExpired = true;
        await user.save();
      }

      return res.status(403).json({
        error: "Your access to this course has expired.",
        hasAccess: false,
        reason: "expired",
        expiryDate: purchasedCourse.expiryDate,
        purchaseDate: purchasedCourse.purchaseDate
      });
    }

    // User has valid access - attach purchase info to request
    req.courseAccess = {
      purchaseDate: purchasedCourse.purchaseDate,
      expiryDate: purchasedCourse.expiryDate,
      daysRemaining: Math.ceil((purchasedCourse.expiryDate - now) / (1000 * 60 * 60 * 24))
    };

    next();
  } catch (error) {
    console.error("❌ Course access check error:", error);
    res.status(500).json({ error: "Failed to verify course access" });
  }
};

/**
 * Helper function to check if user has access to a course (non-middleware version)
 * Returns { hasAccess: boolean, reason: string, expiryDate: Date }
 */
const checkUserCourseAccess = async (userId, courseId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      return { hasAccess: false, reason: "user_not_found" };
    }

    const purchasedCourse = user.purchasedCourses.find(
      (pc) => pc.courseId.toString() === courseId.toString()
    );

    if (!purchasedCourse) {
      return { hasAccess: false, reason: "not_purchased" };
    }

    const now = new Date();
    if (purchasedCourse.expiryDate < now) {
      return {
        hasAccess: false,
        reason: "expired",
        expiryDate: purchasedCourse.expiryDate,
        purchaseDate: purchasedCourse.purchaseDate
      };
    }

    return {
      hasAccess: true,
      reason: "valid",
      purchaseDate: purchasedCourse.purchaseDate,
      expiryDate: purchasedCourse.expiryDate,
      daysRemaining: Math.ceil((purchasedCourse.expiryDate - now) / (1000 * 60 * 60 * 24))
    };
  } catch (error) {
    console.error("❌ Error checking course access:", error);
    return { hasAccess: false, reason: "error", error: error.message };
  }
};

module.exports = { checkCourseAccess, checkUserCourseAccess };
