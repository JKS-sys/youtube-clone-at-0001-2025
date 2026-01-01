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

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // Find user
    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // User data for response
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
      success: true,
      message: "Login successful",
      token: token,
      user: userData,
    });
  } catch (error) {
    console.error("❌ Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Register Route
router.post("/register", async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    if (!email.includes("@")) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // Check if user exists
    const userExists = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (userExists) {
      return res.status(400).json({
        success: false,
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

    // Generate token
    const token = generateToken(user._id);

    // User data for response
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
      success: true,
      message: "Registration successful",
      token: token,
      user: userData,
    });
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Get user profile
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("channels");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

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
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("❌ Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Update user profile
router.put("/me", protect, async (req, res) => {
  try {
    const { username, email, avatar } = req.body;

    // Check if username or email already taken
    if (username && username !== req.user.username) {
      const usernameExists = await User.findOne({ username });
      if (usernameExists) {
        return res.status(400).json({
          success: false,
          message: "Username already taken",
        });
      }
    }

    if (email && email !== req.user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: "Email already taken",
        });
      }
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        username: username || req.user.username,
        email: email || req.user.email,
        avatar: avatar || req.user.avatar,
      },
      { new: true, runValidators: true }
    );

    const userData = {
      _id: updatedUser._id,
      username: updatedUser.username,
      email: updatedUser.email,
      avatar: updatedUser.avatar,
      channels: updatedUser.channels,
      hasChannel: updatedUser.hasChannel,
      createdAt: updatedUser.createdAt,
    };

    res.json({
      success: true,
      message: "Profile updated successfully",
      user: userData,
    });
  } catch (error) {
    console.error("❌ Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update profile",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Logout Route
router.post("/logout", protect, (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

export default router;
