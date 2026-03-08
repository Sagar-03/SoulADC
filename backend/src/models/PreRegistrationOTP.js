const mongoose = require("mongoose");

/**
 * Temporary OTP storage for pre-registration email verification
 * These records are deleted after successful registration or expiry
 */
const preRegistrationOTPSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    otp: {
      type: String,
      required: true
    },
    otpExpire: {
      type: Date,
      required: true
    },
    otpAttempts: {
      type: Number,
      default: 0
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    verifiedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Auto-delete expired OTPs after 1 hour
preRegistrationOTPSchema.index({ otpExpire: 1 }, { expireAfterSeconds: 3600 });

module.exports = mongoose.model("PreRegistrationOTP", preRegistrationOTPSchema);
