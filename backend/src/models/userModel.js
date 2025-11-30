const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    countryCode: { type: String, required: false },
    phone: { type: String, required: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    resetToken: String,
    resetTokenExpire: Date,
    purchasedCourses: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true
        },
        purchaseDate: {
          type: Date,
          default: Date.now
        },
        expiryDate: {
          type: Date,
          required: true
        },
        isExpired: {
          type: Boolean,
          default: false
        }
      }
    ],

    // ✅ Pending payment approvals (awaiting admin approval)
    pendingApprovals: [
      {
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course",
          required: true
        },
        paymentSessionId: {
          type: String,
          required: true
        },
        paymentAmount: {
          type: Number,
          required: true
        },
        paymentDate: {
          type: Date,
          default: Date.now
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending"
        },
        approvedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        approvedAt: {
          type: Date
        },
        rejectionReason: {
          type: String
        }
      }
    ],

    // ✅ Notifications for newly approved courses
    notifications: [
      {
        type: {
          type: String,
          enum: ["course_approved", "course_rejected", "course_expiring"],
          required: true
        },
        courseId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Course"
        },
        message: {
          type: String,
          required: true
        },
        isRead: {
          type: Boolean,
          default: false
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    //  One active session per user
    activeSession: {
      token: { type: String },       
      deviceInfo: { type: String },  
      ipAddress: { type: String },   
      loginAt: { type: Date },       
      logoutAt: { type: Date },      
    },

    // ✅ Streak tracking
    streak: {
      current: { type: Number, default: 0 },
      highest: { type: Number, default: 0 },
      lastLoginDate: { type: Date },
      loginDates: [{ type: Date }]
    },

    // ✅ Video progress tracking
    videoProgress: [{
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      weekId: { type: mongoose.Schema.Types.ObjectId },
      dayId: { type: mongoose.Schema.Types.ObjectId },
      contentId: { type: mongoose.Schema.Types.ObjectId },
      videoTitle: { type: String },
      progress: { type: Number, default: 0, min: 0, max: 1 }, // 0 to 1 (0% to 100%)
      watchTime: { type: Number, default: 0 }, // in seconds
      totalDuration: { type: Number, default: 0 }, // in seconds
      completed: { type: Boolean, default: false },
      lastWatchedAt: { type: Date, default: Date.now },
      firstWatchedAt: { type: Date, default: Date.now }
    }],

    // ✅ Course progress summary
    courseProgress: [{
      courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course' },
      totalVideos: { type: Number, default: 0 },
      completedVideos: { type: Number, default: 0 },
      totalWatchTime: { type: Number, default: 0 }, // in hours
      overallProgress: { type: Number, default: 0, min: 0, max: 1 }, // 0 to 1
      lastAccessedAt: { type: Date, default: Date.now },
      enrolledAt: { type: Date, default: Date.now }
    }],
  },
  { timestamps: true }
);

// ✅ Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ✅ Compare passwords
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
