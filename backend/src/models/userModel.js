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
