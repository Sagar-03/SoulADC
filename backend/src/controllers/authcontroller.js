const User = require("../models/userModel");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

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
        { expiresIn: "1h" }
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
      console.log("❌ User not found:", email);
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
      { expiresIn: "1h" }
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

module.exports = { register, login };
