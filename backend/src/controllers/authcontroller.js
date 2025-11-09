const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

// REGISTER controller
const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;
    console.log("Register request:", { name, email, phone }); // log incoming data (without password)

    if (!name || !email || !password) {
      console.log(" Missing required fields");
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      console.log("User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      phone: phone || "", // phone is optional
      role: "user" // default role
    });
    await user.save();

    console.log(" User registered successfully:", email);
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Register error:", error);
    res.status(500).json({ message: "Registration failed", error: error.message });
  }
};
// LOGIN controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("📩 Login request:", { email, password }); // Debug log

    // Check for hardcoded admin credentials
    if (email === "admin@souladc.com" && password === "admin123") {
      const token = jwt.sign(
        { id: "admin", email: "admin@souladc.com", role: "admin" },
        process.env.JWT_SECRET,
    
      );
      return res.json({
        message: "Admin login successful",
        token,
        role: "admin",
        user: { email: "admin@souladc.com", role: "admin" }
      });
    }

    // Find user in database
    const user = await User.findOne({ email });
    if (!user) {
      console.log(" User not found:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log("Password mismatch for user:", email);
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Generate JWT for regular user
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role || "user" },
      process.env.JWT_SECRET,
    );

    console.log("User login successful:", email);
    res.json({
      message: "Login successful",
      token,
      role: user.role || "user",
      user: {
        id: user._id,
        email: user.email,
        role: user.role || "user",
        name: user.name,
        purchasedCourses: user.purchasedCourses || []
      }
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

// UPDATE PROFILE controller
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body;
    const userId = req.user.id;

    // Validate required fields
    if (!name || !email) {
      return res.status(400).json({ message: "Name and email are required" });
    }

    // Check if email is already taken by another user
    const existingUser = await User.findOne({ 
      email, 
      _id: { $ne: userId } 
    });
    
    if (existingUser) {
      return res.status(400).json({ message: "Email is already taken by another user" });
    }

    // Update user profile
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { 
        name: name.trim(),
        email: email.trim().toLowerCase()
      },
      { new: true, runValidators: true }
    ).select('-password -resetToken -resetTokenExpire');

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log("Profile updated successfully for user:", email);
    res.json({
      message: "Profile updated successfully",
      user: {
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        phone: updatedUser.phone,
        role: updatedUser.role,
        purchasedCourses: updatedUser.purchasedCourses || []
      }
    });

  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Profile update failed", error: error.message });
  }
};

module.exports = { register, login, forgotPassword, resetPassword, updateProfile };
