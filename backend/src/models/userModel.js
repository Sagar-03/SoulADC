const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    phone: { type: String, required: false },
    role: { type: String, enum: ["user", "admin"], default: "user" },
    resetToken: String,
    resetTokenExpire: Date,
    // ✅ Purchased courses
    purchasedCourses: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course'
    }],

    // ✅ One active session per user
    activeSession: {
      token: { type: String },       // store latest JWT or sessionId
      deviceInfo: { type: String },  // browser / OS (user-agent)
      ipAddress: { type: String },   // optional: track login IP
      loginAt: { type: Date },       // last login time
      logoutAt: { type: Date },      // last logout time
    },

    // ✅ Streak tracking
    streak: {
      current: { type: Number, default: 0 },
      highest: { type: Number, default: 0 },
      lastLoginDate: { type: Date },
      loginDates: [{ type: Date }] // Store all login dates for streak calculation
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
