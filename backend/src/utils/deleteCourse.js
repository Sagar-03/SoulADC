/**
 * Safely delete a course
 * Usage: node deleteCourse.js <courseId>
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('../models/Course');
const User = require('../models/userModel');

async function deleteCourse(courseId) {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.ConnectionString;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }

    console.log(`📚 Course: "${course.title}"`);
    console.log(`   ID: ${course._id}`);
    console.log(`   Duration: ${course.durationMonths} months`);
    console.log(`   Weeks: ${course.weeks.length}`);
    console.log(`   Shared Content: ${course.sharedContentId ? 'Yes' : 'No'}\n`);

    // Check if any users have purchased this course
    const usersWithCourse = await User.countDocuments({
      'purchasedCourses.courseId': courseId
    });

    if (usersWithCourse > 0) {
      console.log(`⚠️  WARNING: ${usersWithCourse} user(s) have purchased this course!`);
      console.log(`   Deleting will NOT remove from user's purchased list.`);
      console.log(`   Users will get "course not found" errors.\n`);
      console.log(`❌ Aborted. Please migrate users first or proceed manually.\n`);
      process.exit(1);
    }

    console.log(`✅ Safe to delete (no users have purchased)\n`);
    console.log(`🗑️  Deleting course...`);

    await Course.findByIdAndDelete(courseId);

    console.log(`✅ Course deleted successfully!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

if (require.main === module) {
  const [courseId] = process.argv.slice(2);
  
  if (!courseId) {
    console.error('❌ Usage: node deleteCourse.js <courseId>');
    process.exit(1);
  }

  deleteCourse(courseId)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { deleteCourse };
