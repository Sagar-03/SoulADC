/**
 * Migration Script: Convert Existing Course to Shared Content
 * 
 * This script converts an existing course with content into shared content,
 * then creates two new courses that reference it with different durations.
 * 
 * Usage: node src/utils/convertToSharedContent.js <courseId> <duration1> <duration2>
 * Example: node src/utils/convertToSharedContent.js 6475a1b2c3d4e5f6g7h8i9j0 5 10
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('../models/Course');
const SharedContent = require('../models/SharedContent');

async function convertCourseToSharedContent(sourceCourseId, duration1, duration2) {
  try {
    console.log('🔄 Starting conversion...\n');

    // Connect to MongoDB - handle both MONGO_URI and ConnectionString
    const mongoUri = process.env.MONGO_URI || process.env.ConnectionString;
    
    if (!mongoUri) {
      throw new Error('MongoDB connection string not found. Please set MONGO_URI or ConnectionString in .env file');
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    // Fetch the source course
    const sourceCourse = await Course.findById(sourceCourseId);
    if (!sourceCourse) {
      throw new Error(`Course with ID ${sourceCourseId} not found`);
    }

    console.log(`📚 Found course: "${sourceCourse.title}"`);
    console.log(`   - Weeks: ${sourceCourse.weeks.length}`);
    console.log(`   - Current Duration: ${sourceCourse.durationMonths} months\n`);

    // Create shared content from the source course
    const sharedContent = new SharedContent({
      name: `${sourceCourse.title} - Shared Content`,
      description: sourceCourse.description,
      weeks: sourceCourse.weeks // Copy all weeks/days/contents
    });

    await sharedContent.save();
    console.log(`✅ Created shared content: "${sharedContent.name}"`);
    console.log(`   - Shared Content ID: ${sharedContent._id}\n`);

    // Create Course 1 with duration1
    const course1 = new Course({
      title: `${sourceCourse.title} - ${duration1} Month Access`,
      description: sourceCourse.description,
      durationMonths: parseInt(duration1),
      price: sourceCourse.price,
      cutPrice: sourceCourse.cutPrice,
      thumbnail: sourceCourse.thumbnail,
      sharedContentId: sharedContent._id,
      weeks: [], // Empty - uses shared content
      isLive: sourceCourse.isLive
    });

    await course1.save();
    console.log(`✅ Created Course 1: "${course1.title}"`);
    console.log(`   - Course ID: ${course1._id}`);
    console.log(`   - Duration: ${course1.durationMonths} months\n`);

    // Create Course 2 with duration2
    const course2 = new Course({
      title: `${sourceCourse.title} - ${duration2} Month Access`,
      description: sourceCourse.description,
      durationMonths: parseInt(duration2),
      price: sourceCourse.price * 1.5, // 50% more for longer access (adjust as needed)
      cutPrice: sourceCourse.cutPrice ? sourceCourse.cutPrice * 1.5 : null,
      thumbnail: sourceCourse.thumbnail,
      sharedContentId: sharedContent._id,
      weeks: [], // Empty - uses shared content
      isLive: sourceCourse.isLive
    });

    await course2.save();
    console.log(`✅ Created Course 2: "${course2.title}"`);
    console.log(`   - Course ID: ${course2._id}`);
    console.log(`   - Duration: ${course2.durationMonths} months\n`);

    console.log('=================================');
    console.log('🎉 Conversion completed successfully!');
    console.log('=================================');
    console.log('\n📋 Summary:');
    console.log(`   - Shared Content ID: ${sharedContent._id}`);
    console.log(`   - Course 1 ID: ${course1._id} (${duration1} months)`);
    console.log(`   - Course 2 ID: ${course2._id} (${duration2} months)`);
    console.log('\n💡 Next steps:');
    console.log('   1. Test both courses to ensure content is visible');
    console.log('   2. Update content via Shared Content API');
    console.log('   3. Adjust prices if needed');
    console.log(`   4. Delete old course if no longer needed: ${sourceCourseId}`);
    console.log('\n⚠️  Note: Original course was NOT deleted. Delete manually if needed.\n');

  } catch (error) {
    console.error('\n❌ Conversion failed:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

// Run the script
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length !== 3) {
    console.error('❌ Usage: node convertToSharedContent.js <courseId> <duration1> <duration2>');
    console.error('   Example: node convertToSharedContent.js 6475a1b2c3d4e5f6g7h8i9j0 5 10');
    process.exit(1);
  }

  const [courseId, duration1, duration2] = args;

  if (isNaN(duration1) || isNaN(duration2) || duration1 < 1 || duration2 < 1) {
    console.error('❌ Durations must be positive numbers');
    process.exit(1);
  }

  convertCourseToSharedContent(courseId, duration1, duration2)
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { convertCourseToSharedContent };
