import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";

// Import routes
import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";
import channelRoutes from "./routes/channels.js";

dotenv.config();

const app = express();

// CORS Configuration
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5001",
  "https://youtube-clone-at-0001-2025.vercel.app", // Add your Vercel URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Handle preflight requests
app.options("*", cors());

// Body parsing middleware
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/channels", channelRoutes);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database:
      mongoose.connection.readyState === 1 ? "Connected" : "Disconnected",
    environment: process.env.NODE_ENV || "development",
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    message: "YouTube Clone API is working!",
    endpoints: {
      auth: "/api/auth",
      videos: "/api/videos",
      channels: "/api/channels",
    },
  });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/youtube-clone";
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected Successfully");

    // Check connection status
    console.log("📊 Database Stats:");
    console.log(`   Host: ${mongoose.connection.host}`);
    console.log(`   Database: ${mongoose.connection.name}`);
    console.log(`   Ready State: ${mongoose.connection.readyState}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);

    // Try to reconnect in production
    if (process.env.NODE_ENV === "production") {
      setTimeout(connectDB, 5000);
    }
  }
};

// Handle MongoDB connection events
mongoose.connection.on("connected", () => {
  console.log("📈 MongoDB Connected");
});

mongoose.connection.on("error", (err) => {
  console.error("❌ MongoDB Connection Error:", err);
});

mongoose.connection.on("disconnected", () => {
  console.log("⚠️ MongoDB Disconnected");
});

// Connect to MongoDB
connectDB();

// Start server
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`🔧 API Test: http://localhost:${PORT}/api/test`);
});
