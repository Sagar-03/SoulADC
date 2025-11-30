/**
 * Helper script to manage your courses
 * Lists courses and helps identify which to keep/delete
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('../models/Course');
const SharedContent = require('../models/SharedContent');

async function listCourses() {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.ConnectionString;
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB\n');

    const courses = await Course.find().populate('sharedContentId', 'name');
    const sharedContents = await SharedContent.find();

    console.log('📚 SHARED CONTENT LIBRARIES');
    console.log('='.repeat(60));
    
    if (sharedContents.length === 0) {
      console.log('   No shared content found\n');
    } else {
      for (const sc of sharedContents) {
        const coursesUsing = await Course.countDocuments({ sharedContentId: sc._id });
        console.log(`\n   Name: ${sc.name}`);
        console.log(`   ID: ${sc._id}`);
        console.log(`   Weeks: ${sc.weeks.length}`);
        console.log(`   Used by: ${coursesUsing} course(s)`);
      }
    }

    console.log('\n\n📖 ALL COURSES');
    console.log('='.repeat(60));

    for (const course of courses) {
      console.log(`\n   Title: ${course.title}`);
      console.log(`   ID: ${course._id}`);
      console.log(`   Duration: ${course.durationMonths} months`);
      console.log(`   Price: $${course.price}`);
      console.log(`   Weeks: ${course.weeks.length} ${course.weeks.length > 0 ? '(Direct)' : ''}`);
      console.log(`   Shared Content: ${course.sharedContentId ? `✅ ${course.sharedContentId.name}` : '❌ No'}`);
      console.log(`   Live: ${course.isLive ? '🟢 Yes' : '🔴 No'}`);
    }

    console.log('\n\n💡 RECOMMENDATIONS');
    console.log('='.repeat(60));

    // Find old courses (have weeks but no sharedContentId)
    const oldCourses = courses.filter(c => c.weeks.length > 0 && !c.sharedContentId);
    
    if (oldCourses.length > 0) {
      console.log('\n⚠️  OLD COURSES (Can be deleted):');
      oldCourses.forEach(c => {
        console.log(`   - "${c.title}" (${c._id})`);
        console.log(`     → Has direct content (${c.weeks.length} weeks)`);
        console.log(`     → Not using shared content`);
        console.log(`     → DELETE: node src/utils/deleteCourse.js ${c._id}\n`);
      });
    }

    // Find new courses using shared content
    const newCourses = courses.filter(c => c.sharedContentId);
    
    if (newCourses.length > 0) {
      console.log('\n✅ ACTIVE COURSES (Keep these):');
      newCourses.forEach(c => {
        console.log(`   - "${c.title}" (${c._id})`);
        console.log(`     → ${c.durationMonths} months access`);
        console.log(`     → Using shared content ✅`);
      });
    }

    console.log('\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
  }
}

listCourses()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
