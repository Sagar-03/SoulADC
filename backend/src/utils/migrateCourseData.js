/**
 * Migration script to update existing data for the course expiry feature
 * Run this once to migrate existing courses and user purchases
 * 
 * Usage: node src/utils/migrateCourseData.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const Course = require('../models/Course');
const User = require('../models/userModel');

// Default duration for existing courses (in months)
const DEFAULT_DURATION_MONTHS = 12;

async function migrateCourses() {
  console.log('🔄 Starting course migration...');
  
  try {
    // Update all courses that don't have durationMonths set
    const coursesWithoutDuration = await Course.find({ 
      $or: [
        { durationMonths: { $exists: false } },
        { durationMonths: null },
        { durationMonths: 0 }
      ]
    });

    console.log(`📚 Found ${coursesWithoutDuration.length} courses without duration`);

    for (const course of coursesWithoutDuration) {
      course.durationMonths = DEFAULT_DURATION_MONTHS;
      await course.save();
      console.log(`✅ Updated course: ${course.title} - Duration: ${DEFAULT_DURATION_MONTHS} months`);
    }

    console.log('✅ Course migration completed!\n');
    return coursesWithoutDuration.length;
  } catch (error) {
    console.error('❌ Error migrating courses:', error);
    throw error;
  }
}

async function migrateUserPurchases() {
  console.log('🔄 Starting user purchases migration...');
  
  try {
    // Find all users with the old purchasedCourses structure
    const users = await User.find({
      purchasedCourses: { $exists: true, $ne: [] }
    });

    console.log(`👥 Found ${users.length} users with purchased courses`);

    let updatedCount = 0;
    
    for (const user of users) {
      let needsUpdate = false;
      const newPurchasedCourses = [];

      for (const pc of user.purchasedCourses) {
        // Check if it's the old structure (just an ObjectId) or already migrated
        if (pc.courseId) {
          // Already in new format
          newPurchasedCourses.push(pc);
        } else {
          // Old format - migrate it
          needsUpdate = true;
          
          // Fetch course to get duration
          const course = await Course.findById(pc);
          if (!course) {
            console.warn(`⚠️  Course ${pc} not found for user ${user.email}`);
            continue;
          }

          const purchaseDate = new Date();
          // For existing purchases, set purchase date to 1 month ago as a default
          purchaseDate.setMonth(purchaseDate.getMonth() - 1);
          
          const expiryDate = new Date(purchaseDate);
          expiryDate.setMonth(expiryDate.getMonth() + course.durationMonths);

          newPurchasedCourses.push({
            courseId: pc,
            purchaseDate: purchaseDate,
            expiryDate: expiryDate,
            isExpired: false
          });

          console.log(`  ✅ Migrated: ${course.title} for ${user.email}`);
        }
      }

      if (needsUpdate) {
        user.purchasedCourses = newPurchasedCourses;
        await user.save();
        updatedCount++;
        console.log(`✅ Updated user: ${user.email} (${newPurchasedCourses.length} courses)`);
      }
    }

    console.log(`✅ User purchases migration completed! Updated ${updatedCount} users\n`);
    return updatedCount;
  } catch (error) {
    console.error('❌ Error migrating user purchases:', error);
    throw error;
  }
}

async function runMigration() {
  console.log('🚀 Starting database migration for course expiry feature\n');
  
  try {
    // Connect to MongoDB - handle both MONGO_URI and ConnectionString
    const mongoUri = process.env.MONGO_URI || process.env.ConnectionString;
    
    if (!mongoUri) {
      throw new Error('MongoDB connection string not found. Please set MONGO_URI or ConnectionString in .env file');
    }
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB\n');

    // Run migrations
    const coursesUpdated = await migrateCourses();
    const usersUpdated = await migrateUserPurchases();

    console.log('\n=================================');
    console.log('🎉 Migration completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Courses updated: ${coursesUpdated}`);
    console.log(`   - Users updated: ${usersUpdated}`);
    console.log('=================================\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('👋 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the migration
if (require.main === module) {
  runMigration();
}

module.exports = { migrateCourses, migrateUserPurchases };
