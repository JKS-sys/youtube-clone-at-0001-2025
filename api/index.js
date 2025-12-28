// api/index.js - Working API for Vercel
import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Import routes
import authRoutes from "../backend/routes/auth.js";
import videoRoutes from "../backend/routes/videos.js";
import channelRoutes from "../backend/routes/channels.js";

dotenv.config();

const app = express();

// CORS - Allow all origins for now
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Test route
app.get("/api/test", (req, res) => {
  res.json({
    message: "API is working on Vercel!",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/channels", channelRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "YouTube Clone API is running",
  });
});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      console.log("⚠️ MONGODB_URI not set, using local fallback");
      return;
    }
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected on Vercel");
  } catch (error) {
    console.error("❌ MongoDB Error:", error.message);
  }
};

connectDB();

export default app;
