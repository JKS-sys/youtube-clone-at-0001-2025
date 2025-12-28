import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Routes
import authRoutes from "../backend/routes/auth.js";
import videoRoutes from "../backend/routes/videos.js";
import channelRoutes from "../backend/routes/channels.js";

dotenv.config();

const app = express();

// CORS
app.use(
  cors({
    origin: [
      "https://youtube-clone-at-0001-2025.vercel.app",
      "https://youtube-clone-*.vercel.app",
      "http://localhost:3000",
    ],
    credentials: true,
  })
);

app.use(express.json());

// Routes
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

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI;
    if (!mongoURI) {
      throw new Error("MONGODB_URI is not defined");
    }
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    // Don't exit in serverless environment
  }
};

// Connect to DB
connectDB();

// Export for Vercel
export default app;
