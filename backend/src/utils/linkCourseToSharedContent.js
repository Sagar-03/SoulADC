/**
 * Quick script to link an existing course to shared content
 * Usage: node linkCourseToSharedContent.js <courseId> <sharedContentId>
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('../models/Course');

async function linkCourse(courseId, sharedContentId) {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.ConnectionString;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const course = await Course.findById(courseId);
    if (!course) {
      throw new Error(`Course ${courseId} not found`);
    }

    console.log(`📚 Linking course: "${course.title}"`);
    
    course.sharedContentId = sharedContentId;
    course.weeks = []; // Clear existing weeks, will use shared content
    await course.save();

    console.log(`✅ Successfully linked to shared content`);
    console.log(`   - Course ID: ${course._id}`);
    console.log(`   - Shared Content ID: ${sharedContentId}`);
    console.log(`\n✨ Course now uses shared content!\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  const [courseId, sharedContentId] = process.argv.slice(2);
  
  if (!courseId || !sharedContentId) {
    console.error('❌ Usage: node linkCourseToSharedContent.js <courseId> <sharedContentId>');
    process.exit(1);
  }

  linkCourse(courseId, sharedContentId)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { linkCourse };
