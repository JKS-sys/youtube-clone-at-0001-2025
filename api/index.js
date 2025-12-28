// api/index.js - Vercel Serverless API Handler
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Import your backend routes
import authRoutes from "../backend/routes/auth.js";
import videoRoutes from "../backend/routes/videos.js";
import channelRoutes from "../backend/routes/channels.js";

// Load environment variables
dotenv.config();

const app = express();

// CORS Configuration
app.use(
  cors({
    origin: [
      "https://youtube-clone-at-0001-2025.vercel.app",
      "https://youtube-clone-*.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Parse JSON
app.use(express.json());

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/channels", channelRoutes);

// Health Check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "YouTube Clone API is running on Vercel",
    environment: process.env.NODE_ENV || "development",
  });
});

// Test Endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working!",
    timestamp: new Date().toISOString(),
    endpoint: "/api/test",
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.error("❌ MONGODB_URI is not defined");
      return;
    }

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected to Vercel");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
  }
};

// Connect to Database
connectDB();

// Error handling middleware
app.use((err, req, res, next) => {
  console.error("❌ Server Error:", err.stack);
  res.status(500).json({
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "production" ? {} : err.message,
  });
});

// 404 Handler
app.use("*", (req, res) => {
  res.status(404).json({
    message: "API endpoint not found",
    requestedUrl: req.originalUrl,
  });
});

// Export for Vercel
export default app;
