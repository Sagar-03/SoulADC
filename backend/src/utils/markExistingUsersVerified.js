/**
 * Migration Script: Mark Existing Users as Email Verified
 * 
 * This script marks all existing users (registered before email verification was implemented)
 * as verified so they can continue to log in.
 * 
 * Run this ONCE after deploying the email verification feature.
 * 
 * Usage: node backend/src/utils/markExistingUsersVerified.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/userModel');

const markExistingUsersVerified = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users who don't have isEmailVerified field set to true
    const usersToUpdate = await User.find({
      $or: [
        { isEmailVerified: { $exists: false } },
        { isEmailVerified: false }
      ]
    });

    console.log(`Found ${usersToUpdate.length} users to mark as verified`);

    if (usersToUpdate.length === 0) {
      console.log('No users need to be updated. All users are already verified.');
      process.exit(0);
    }

    // Update all users to mark them as verified
    const result = await User.updateMany(
      {
        $or: [
          { isEmailVerified: { $exists: false } },
          { isEmailVerified: false }
        ]
      },
      {
        $set: { 
          isEmailVerified: true,
          verificationOTP: undefined,
          verificationOTPExpire: undefined,
          verificationOTPAttempts: 0
        }
      }
    );

    console.log(`✅ Successfully updated ${result.modifiedCount} users`);
    console.log('All existing users are now marked as email verified');
    console.log('\nDetails:');
    console.log(`- Total users found: ${usersToUpdate.length}`);
    console.log(`- Users updated: ${result.modifiedCount}`);
    
    // Show sample of updated users
    const updatedUsers = await User.find({ isEmailVerified: true })
      .select('name email role isEmailVerified createdAt')
      .limit(5);
    
    console.log('\nSample of verified users:');
    updatedUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email}) - Role: ${user.role}`);
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error marking users as verified:', error);
    process.exit(1);
  }
};

// Run the migration
markExistingUsersVerified();
