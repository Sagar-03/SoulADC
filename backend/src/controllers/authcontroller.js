const User = require("../models/userModel");
const PreRegistrationOTP = require("../models/PreRegistrationOTP");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");

// REGISTER controller
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    console.log("Register request:", { name, email, phone }); // log incoming data (without password)

    if (!name || !email || !password) {
      console.log("❌ Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    // Check if email was verified through pre-registration OTP
    const preRegOTP = await PreRegistrationOTP.findOne({ email });
    
    if (!preRegOTP || !preRegOTP.isVerified) {
      return res.status(400).json({ 
        message: "Email not verified. Please verify your email before registration.",
        requiresVerification: true
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("❌ User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    // Create the user with verified email
    const user = new User({
      name,
      email,
      password: password, // Pass plain password - will be hashed by pre-save hook
      phone: phone || "", // phone is optional
      role: "user", // default role
      isEmailVerified: true, // Already verified through OTP
      isTemporary: false
    });
    await user.save();

    // Delete the pre-registration OTP record after successful registration
    await PreRegistrationOTP.deleteOne({ email });

    // Send welcome email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Welcome to SoulADC</h2>
        <p>Hello ${name},</p>
        <p>Your registration is complete! Welcome to SoulADC LMS.</p>
        <p>You can now log in and start your learning journey with us.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">SoulADC LMS - Your Learning Partner</p>
      </div>
    `;

    try {
      await sendEmail(email, "Welcome to SoulADC LMS", html);
      console.log(`Welcome email sent to ${email}`);
    } catch (emailError) {
      console.error(" Error sending welcome email:", emailError);
      // Continue registration even if email fails
    }

    console.log(" User registered successfully:", email);
    res.status(201).json({ 
      message: "Registration successful! You can now log in.",
      success: true,
      email: email
    });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};
// LOGIN controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login request:", { email, password }); // Debug log

    // Check for hardcoded admin credentials - create or find admin user
    if (email === "admin@souladc.com" && password === "souladc_admin_365") {
      let adminUser = await User.findOne({ email: "admin@souladc.com" });
      
      // Create admin user if doesn't exist
      if (!adminUser) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("souladc_admin_365", salt);
        
        adminUser = new User({
          name: "Admin",
          email: "admin@souladc.com",
          password: hashedPassword,
          role: "admin",
          isEmailVerified: true // Admin doesn't need verification
        });
        await adminUser.save();
        console.log("Admin user created in database");
      } else if (!adminUser.isEmailVerified) {
        // Ensure existing admin has email verified
        adminUser.isEmailVerified = true;
        await adminUser.save();
      }
      
      const token = jwt.sign(
        { id: adminUser._id, email: adminUser.email, role: "admin" },
        process.env.JWT_SECRET,
      );
      
      return res.json({
        message: "Admin login successful",
        token,
        role: "admin",
        user: { 
          id: adminUser._id,
          email: adminUser.email, 
          role: "admin",
          name: adminUser.name
        }
      });
    }

    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      console.log(" User not found:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check password first (before email verification check)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch for user:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Auto-verify existing users who don't have verified status (for backward compatibility)
    if (user.role !== "admin" && !user.isEmailVerified) {
      console.log("Auto-verifying existing user:", email);
      user.isEmailVerified = true;
      await user.save();
    }

    // ✅ DEVICE & IP SECURITY CHECK (only for non-admin users)
    if (user.role !== "admin") {
      // Import at top: const { getClientIp } = require('../middleware/deviceSecurityMiddleware');
      const getClientIp = (req) => {
        let ip = null;
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded) {
          ip = forwarded.split(',')[0].trim();
        } else {
          ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress;
        }
        if (ip === '::1' || ip === '::ffff:127.0.0.1') {
          ip = '127.0.0.1';
        }
        if (ip && ip.startsWith('::ffff:')) {
          ip = ip.substring(7);
        }
        return ip;
      };
      const currentIp = getClientIp(req);
      const currentFingerprint = req.body.deviceFingerprint;

      console.log("🔍 Device Security Check for", user.email, ":", {
        currentIp,
        storedIp: user.registeredIp || 'null',
        hasStoredIp: !!user.registeredIp,
        currentFingerprint: currentFingerprint?.substring(0, 12) + '...' || 'null',
        storedFingerprint: user.deviceFingerprint?.substring(0, 12) + '...' || 'null',
        hasStoredFingerprint: !!user.deviceFingerprint
      });

      // Check if device was reset by admin or first-time login
      // Use explicit null/undefined checks to handle all cases properly
      const isFirstLoginOrReset = (user.registeredIp === null || user.registeredIp === undefined) && 
                                   (user.deviceFingerprint === null || user.deviceFingerprint === undefined);

      if (isFirstLoginOrReset) {
        if (currentFingerprint) {
          user.registeredIp = currentIp;
          user.deviceFingerprint = currentFingerprint;
          await user.save();
          console.log("✅ Device registered (first login or after reset):", { 
            ip: currentIp, 
            fingerprint: currentFingerprint.substring(0, 10) + '...' 
          });
        } else {
          console.log("⚠️ Warning: No device fingerprint provided on first login");
        }
      } else {
        // Subsequent logins - verify IP and fingerprint match
        const ipMatches = user.registeredIp === currentIp;
        const fingerprintMatches = user.deviceFingerprint === currentFingerprint;

        if (!ipMatches || !fingerprintMatches) {
          console.log("❌ Login blocked - Device/IP mismatch:", {
            storedIp: user.registeredIp,
            currentIp,
            ipMatches,
            storedFingerprint: user.deviceFingerprint?.substring(0, 10) + '...',
            currentFingerprint: currentFingerprint?.substring(0, 10) + '...',
            fingerprintMatches
          });
          return res.status(403).json({ 
            success: false,
            message: "🔒 Login blocked: Unauthorized device or IP detected.",
            details: "This account is locked to a specific device. Contact support to unlock your account or login from your registered device.",
            errorCode: "DEVICE_LOCK_VIOLATION"
          });
        }
        console.log("✅ Device and IP verified successfully for", user.email);
      }
    }

    // Update streak data
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    let currentStreak = user.streak?.current || 0;
    let highestStreak = user.streak?.highest || 0;
    const lastLoginDate = user.streak?.lastLoginDate;
    let loginDates = user.streak?.loginDates || [];
    
    // Check if user logged in today already
    const todayLogin = loginDates.find(date => {
      const loginDate = new Date(date);
      loginDate.setHours(0, 0, 0, 0);
      return loginDate.getTime() === today.getTime();
    });
    
    if (!todayLogin) {
      // Add today's login
      loginDates.push(today);
      
      if (lastLoginDate) {
        const lastLogin = new Date(lastLoginDate);
        lastLogin.setHours(0, 0, 0, 0);
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastLogin.getTime() === yesterday.getTime()) {
          // Consecutive day - increment streak
          currentStreak += 1;
        } else if (lastLogin.getTime() < yesterday.getTime()) {
          // Missed days - reset streak
          currentStreak = 1;
        }
        // If logged in same day, don't change streak
      } else {
        // First login ever
        currentStreak = 1;
      }
      
      // Update highest streak if current is higher
      if (currentStreak > highestStreak) {
        highestStreak = currentStreak;
      }
      
      // Keep only last 30 days of login dates to prevent excessive storage
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      loginDates = loginDates.filter(date => new Date(date) >= thirtyDaysAgo);
      
      // Update user streak data
      user.streak = {
        current: currentStreak,
        highest: highestStreak,
        lastLoginDate: today,
        loginDates: loginDates
      };
      
      await user.save();
    }

    // Generate JWT for regular user
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET,
    );

    console.log("User login successful:", email);
    
    // Get unread notifications
    const unreadNotifications = user.notifications?.filter(n => !n.isRead) || [];
    
    res.json({
      message: "Login successful",
      token,
      role: user.role || "user",
      user: {
        id: user._id,
        email: user.email,
        role: user.role || "user",
        name: user.name,
        purchasedCourses: user.purchasedCourses || [],
        purchasedMocks: user.purchasedMocks || [],
        streak: {
          current: user.streak?.current || 0,
          highest: user.streak?.highest || 0,
          lastLoginDate: user.streak?.lastLoginDate
        }
      },
      notifications: unreadNotifications
      });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};
// ✅ Forgot Password - Send Reset Link
const forgotPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) return res.status(404).json({ message: "User not found" });

    // Generate token
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 min expiry
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;

    const html = `
      <h2>Password Reset Request</h2>
      <p>Hello ${user.name || "User"},</p>
      <p>Click below to reset your password. This link will expire in 15 minutes:</p>
      <a href="${resetUrl}" target="_blank">${resetUrl}</a>
      <p>If you didn't request this, you can ignore it.</p>
    `;

    await sendEmail(user.email, "Reset your SoulADC LMS password", html);

    res.json({ message: "Password reset link sent to your email." });
  } catch (error) {
    console.error("Error sending reset email:", error);
    res.status(500).json({ message: "Error sending reset email" });
  }
};

// 2️⃣ Reset Password - Update user password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpire: { $gt: Date.now() },
    });

    if (!user)
      return res.status(400).json({ message: "Invalid or expired token." });

    // Hash and update new password
    const hashed = await bcrypt.hash(password, 10);
    user.password = hashed;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    await user.save();

    res.json({ message: "Password reset successful. You can now log in." });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Failed to reset password" });
  }
};

// ✅ NEW: Send OTP for Password Reset
const sendResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found with this email" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Hash OTP before storing
    const hashedOTP = await bcrypt.hash(otp, 10);

    // Store hashed OTP with 10-minute expiry
    user.resetOTP = hashedOTP;
    user.resetOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.resetOTPAttempts = 0; // Reset attempts
    await user.save();

    // Send OTP via email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Password Reset OTP</h2>
        <p>Hello ${user.name || "User"},</p>
        <p>You requested to reset your password. Use the OTP below to verify your identity:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #7B563D; font-size: 36px; margin: 0; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p><strong>This OTP is valid for 10 minutes.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
        <p style="color: #888; font-size: 12px;">SoulADC - Dental Education Platform</p>
      </div>
    `;

    await sendEmail(user.email, "Password Reset OTP - SoulADC", html);

    console.log(`✅ OTP sent to ${email}`);
    res.json({ 
      message: "OTP sent to your email. Please check your inbox.",
      email: email 
    });

  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Failed to send OTP. Please try again." });
  }
};

// ✅ NEW: Verify OTP
const verifyResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if OTP exists and is not expired
    if (!user.resetOTP || !user.resetOTPExpire) {
      return res.status(400).json({ message: "No OTP request found. Please request a new OTP." });
    }

    if (Date.now() > user.resetOTPExpire) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Check attempts limit (max 5 attempts)
    if (user.resetOTPAttempts >= 5) {
      user.resetOTP = undefined;
      user.resetOTPExpire = undefined;
      user.resetOTPAttempts = 0;
      await user.save();
      return res.status(429).json({ message: "Too many failed attempts. Please request a new OTP." });
    }

    // Verify OTP
    const isValid = await bcrypt.compare(otp, user.resetOTP);
    
    if (!isValid) {
      user.resetOTPAttempts += 1;
      await user.save();
      return res.status(400).json({ 
        message: `Invalid OTP. ${5 - user.resetOTPAttempts} attempts remaining.`,
        attemptsRemaining: 5 - user.resetOTPAttempts
      });
    }

    // OTP is valid - generate a temporary token for password reset
    const resetToken = crypto.randomBytes(32).toString("hex");
    user.resetToken = resetToken;
    user.resetTokenExpire = Date.now() + 15 * 60 * 1000; // 15 minutes to reset password
    
    // Clear OTP data (single-use)
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;
    user.resetOTPAttempts = 0;
    
    await user.save();

    console.log(`✅ OTP verified successfully for ${email}`);
    res.json({ 
      message: "OTP verified successfully",
      resetToken: resetToken,
      email: email
    });

  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP. Please try again." });
  }
};

// ✅ NEW: Reset Password with Token (after OTP verification)
const resetPasswordWithToken = async (req, res) => {
  try {
    const { resetToken, email, newPassword } = req.body;

    if (!resetToken || !email || !newPassword) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters long" });
    }

    const user = await User.findOne({
      email,
      resetToken,
      resetTokenExpire: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired reset token" });
    }

    // Update password (will be hashed by pre-save hook)
    user.password = newPassword;
    user.resetToken = undefined;
    user.resetTokenExpire = undefined;
    user.resetOTP = undefined;
    user.resetOTPExpire = undefined;
    user.resetOTPAttempts = 0;
    
    await user.save();

    console.log(`✅ Password reset successfully for ${email}`);
    res.json({ message: "Password reset successful. You can now log in with your new password." });

  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Failed to reset password. Please try again." });
  }
};

// Update user profile

const updateProfile = async (req, res) => {
  try {
    const { name } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name is required" });
    }

    // Update only the name field
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name: name.trim() },
      { new: true, runValidators: true }
    ).select("-password -resetToken -resetTokenExpire");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Profile updated successfully for user:", updatedUser.email);

    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        purchasedCourses: updatedUser.purchasedCourses || [],
        purchasedMocks: updatedUser.purchasedMocks || []
      }
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Profile update failed", error: error.message });
  }
};

// ✅ NEW: Send OTP Before Registration (Pre-Registration Email Verification)
const sendPreRegistrationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered. Please log in." });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if there's an existing OTP record for this email
    let otpRecord = await PreRegistrationOTP.findOne({ email });

    if (otpRecord) {
      // Update existing OTP record
      otpRecord.otp = otp;
      otpRecord.otpExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
      otpRecord.otpAttempts = 0;
      otpRecord.isVerified = false; // Reset verification status
      await otpRecord.save();
      console.log(`♻️ Resending OTP to: ${email}`);
    } else {
      // Create new OTP record
      otpRecord = new PreRegistrationOTP({
        email: email,
        otp: otp,
        otpExpire: Date.now() + 10 * 60 * 1000, // 10 minutes
        otpAttempts: 0,
        isVerified: false
      });
      await otpRecord.save();
      console.log(`✅ Created OTP record for: ${email}`);
    }

    // Send OTP via email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Email Verification - SoulADC LMS</h2>
        <p>Hello,</p>
        <p>Thank you for choosing SoulADC LMS! Please use the OTP below to verify your email address:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">SoulADC LMS - Your Learning Partner</p>
      </div>
    `;

    await sendEmail(email, "Verify Your Email - SoulADC LMS", html);

    console.log(`✅ Pre-registration OTP sent to ${email}`);
    res.json({ 
      message: "Verification OTP sent to your email. Please check your inbox.",
      success: true
    });
  } catch (error) {
    console.error("❌ Error sending pre-registration OTP:", error);
    res.status(500).json({ message: "Failed to send verification OTP" });
  }
};

// ✅ Verify OTP Before Registration
const verifyPreRegistrationOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const otpRecord = await PreRegistrationOTP.findOne({ email });
    if (!otpRecord) {
      return res.status(404).json({ message: "No verification request found. Please request OTP again." });
    }

    // Check if OTP exists and not expired
    if (!otpRecord.otp || !otpRecord.otpExpire) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }

    if (Date.now() > otpRecord.otpExpire) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Check max attempts (prevent brute force)
    if (otpRecord.otpAttempts >= 5) {
      return res.status(400).json({ 
        message: "Too many incorrect attempts. Please request a new OTP." 
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      otpRecord.otpAttempts += 1;
      await otpRecord.save();
      return res.status(400).json({ 
        message: "Invalid OTP",
        attemptsRemaining: 5 - otpRecord.otpAttempts
      });
    }

    // OTP is correct - mark as verified
    otpRecord.isVerified = true;
    otpRecord.verifiedAt = new Date();
    otpRecord.otp = undefined; // Clear OTP after verification
    otpRecord.otpExpire = undefined;
    otpRecord.otpAttempts = 0;
    await otpRecord.save();

    console.log(`✅ Pre-registration email verified for ${email}`);
    res.json({ 
      message: "Email verified successfully! You can now complete registration.",
      success: true 
    });
  } catch (error) {
    console.error("❌ Error verifying pre-registration OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};

// ✅ Send Verification OTP for Email Verification during Registration
const sendVerificationOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to user (expires in 10 minutes)
    user.verificationOTP = otp;
    user.verificationOTPExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    user.verificationOTPAttempts = 0;
    await user.save();

    // Send OTP via email
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4F46E5;">Email Verification - SoulADC LMS</h2>
        <p>Hello ${user.name || "User"},</p>
        <p>Thank you for registering with SoulADC LMS! Please use the OTP below to verify your email address:</p>
        <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
          <h1 style="color: #4F46E5; margin: 0; font-size: 32px; letter-spacing: 5px;">${otp}</h1>
        </div>
        <p>This OTP will expire in <strong>10 minutes</strong>.</p>
        <p>If you didn't request this verification, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 12px;">SoulADC LMS - Your Learning Partner</p>
      </div>
    `;

    await sendEmail(email, "Verify Your Email - SoulADC LMS", html);

    console.log(`✅ Verification OTP sent to ${email}`);
    res.json({ message: "Verification OTP sent to your email" });
  } catch (error) {
    console.error("❌ Error sending verification OTP:", error);
    res.status(500).json({ message: "Failed to send verification OTP" });
  }
};

// ✅ Verify OTP for Email Verification
const verifyEmailOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: "Email is already verified" });
    }

    // Check if OTP exists and not expired
    if (!user.verificationOTP || !user.verificationOTPExpire) {
      return res.status(400).json({ message: "No OTP found. Please request a new one." });
    }

    if (Date.now() > user.verificationOTPExpire) {
      return res.status(400).json({ message: "OTP has expired. Please request a new one." });
    }

    // Check max attempts (prevent brute force)
    if (user.verificationOTPAttempts >= 5) {
      return res.status(400).json({ 
        message: "Too many incorrect attempts. Please request a new OTP." 
      });
    }

    // Verify OTP
    if (user.verificationOTP !== otp) {
      user.verificationOTPAttempts += 1;
      await user.save();
      return res.status(400).json({ 
        message: "Invalid OTP",
        attemptsRemaining: 5 - user.verificationOTPAttempts
      });
    }

    // OTP is correct - mark email as verified
    user.isEmailVerified = true;
    user.verificationOTP = undefined;
    user.verificationOTPExpire = undefined;
    user.verificationOTPAttempts = 0;
    await user.save();

    console.log(`✅ Email verified for ${email}`);
    res.json({ 
      message: "Email verified successfully! You can now log in.",
      success: true 
    });
  } catch (error) {
    console.error("❌ Error verifying email OTP:", error);
    res.status(500).json({ message: "Failed to verify OTP" });
  }
};


module.exports = { 
  register, 
  login, 
  forgotPassword, 
  resetPassword, 
  updateProfile, 
  sendResetOTP, 
  verifyResetOTP, 
  resetPasswordWithToken,
  sendVerificationOTP,
  verifyEmailOTP,
  sendPreRegistrationOTP,
  verifyPreRegistrationOTP
};

