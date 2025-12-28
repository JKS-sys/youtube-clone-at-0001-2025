import express from "express";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

// ✅ Login Route
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log("🔐 Login attempt for:", email);

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    // Find user by email and include password
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      console.log("❌ User not found:", email);
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // ✅ Use the renamed method checkPassword
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      console.log("❌ Invalid password for user:", email);
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    console.log("✅ Login successful for:", user.username);

    // Generate token
    const token = generateToken(user._id);

    // Prepare user data for response
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      channels: user.channels,
      hasChannel: user.hasChannel,
      createdAt: user.createdAt,
    };

    res.json({
      ...userData,
      token,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Fixed Register Route
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log("📝 Registration attempt for:", email);

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        message: "Password must be at least 6 characters",
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Check if user exists
    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        username
      )}&background=random`,
    });

    console.log("✅ User created:", user.username);

    // Generate token
    const token = generateToken(user._id);

    // Prepare user data for response
    const userData = {
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      channels: user.channels,
      hasChannel: user.hasChannel,
      createdAt: user.createdAt,
    };

    res.status(201).json({
      ...userData,
      token,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get user profile
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      _id: user._id,
      username: user.username,
      email: user.email,
      avatar: user.avatar,
      channels: user.channels,
      hasChannel: user.hasChannel,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
