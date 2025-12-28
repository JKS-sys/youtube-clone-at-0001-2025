import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Import routes
import authRoutes from "./routes/auth.js";
import videoRoutes from "./routes/videos.js";
import channelRoutes from "./routes/channels.js";

// Load environment variables
dotenv.config();

const app = express();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// CORS configuration - ALLOW EVERYTHING FOR DEVELOPMENT
app.use(
  cors({
    origin: "*", // Allow ALL origins for now
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  })
);

// Handle preflight requests
app.options("*", cors());

// Parse JSON
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ ADD MISSING ROUTES DIRECTLY HERE ============
// This ensures PUT/DELETE work even if videos.js has issues

import Video from "./models/Video.js";
import { protect } from "./middleware/auth.js";

// Direct PUT route for videos (adds to existing routes)
app.put("/api/videos/:id", protect, async (req, res) => {
  try {
    console.log("✅ DIRECT PUT /api/videos/:id called for:", req.params.id);
    console.log("Body:", req.body);

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check if user owns the video
    if (video.uploader.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to edit this video" });
    }

    const updatedVideo = await Video.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName");

    console.log("✅ Video updated successfully:", updatedVideo.title);
    res.json(updatedVideo);
  } catch (error) {
    console.error("❌ Error in direct PUT:", error);
    res.status(500).json({ message: error.message });
  }
});

// Direct DELETE route for videos
app.delete("/api/videos/:id", protect, async (req, res) => {
  try {
    console.log("✅ DIRECT DELETE /api/videos/:id called for:", req.params.id);

    const video = await Video.findById(req.params.id);
    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Check if user owns the video
    if (video.uploader.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to delete this video" });
    }

    await video.deleteOne();
    console.log("✅ Video deleted successfully:", req.params.id);
    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("❌ Error in direct DELETE:", error);
    res.status(500).json({ message: error.message });
  }
});

// Direct comment routes
app.put(
  "/api/videos/:videoId/comments/:commentId",
  protect,
  async (req, res) => {
    try {
      const { videoId, commentId } = req.params;
      const { text } = req.body;

      console.log("✅ DIRECT PUT comment route:", { videoId, commentId });

      if (!text || text.trim() === "") {
        return res.status(400).json({ message: "Comment text is required" });
      }

      const video = await Video.findById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const comment = video.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Check if user owns the comment
      if (comment.userId.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to edit this comment" });
      }

      comment.text = text.trim();
      await video.save();

      // Populate user info
      const populatedVideo = await Video.findById(videoId).populate(
        "comments.userId",
        "username avatar"
      );

      const updatedComment = populatedVideo.comments.id(commentId);

      res.json(updatedComment);
    } catch (error) {
      console.error("❌ Error in direct PUT comment:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

app.delete(
  "/api/videos/:videoId/comments/:commentId",
  protect,
  async (req, res) => {
    try {
      const { videoId, commentId } = req.params;
      console.log("✅ DIRECT DELETE comment route:", { videoId, commentId });

      const video = await Video.findById(videoId);
      if (!video) {
        return res.status(404).json({ message: "Video not found" });
      }

      const comment = video.comments.id(commentId);
      if (!comment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      // Check if user owns the comment
      if (comment.userId.toString() !== req.user._id.toString()) {
        return res
          .status(403)
          .json({ message: "Not authorized to delete this comment" });
      }

      video.comments.pull(commentId);
      await video.save();

      res.json({ message: "Comment deleted successfully" });
    } catch (error) {
      console.error("❌ Error in direct DELETE comment:", error);
      res.status(500).json({ message: error.message });
    }
  }
);

// ============ END OF DIRECT ROUTES ============

// Use imported routes
app.use("/api/auth", authRoutes);
app.use("/api/videos", videoRoutes);
app.use("/api/channels", channelRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    message: "YouTube Clone API is running",
    routes: {
      "GET /api/videos": "Get all videos",
      "PUT /api/videos/:id": "Update video (direct route)",
      "DELETE /api/videos/:id": "Delete video (direct route)",
    },
  });
});

// Test endpoint
app.get("/api/test-routes", (req, res) => {
  const routes = [
    { method: "GET", path: "/api/videos", description: "Get all videos" },
    { method: "GET", path: "/api/videos/:id", description: "Get single video" },
    { method: "POST", path: "/api/videos", description: "Create video" },
    {
      method: "PUT",
      path: "/api/videos/:id",
      description: "Update video (DIRECT ROUTE ADDED)",
    },
    {
      method: "DELETE",
      path: "/api/videos/:id",
      description: "Delete video (DIRECT ROUTE ADDED)",
    },
    { method: "POST", path: "/api/videos/:id/like", description: "Like video" },
    {
      method: "POST",
      path: "/api/videos/:id/dislike",
      description: "Dislike video",
    },
    {
      method: "POST",
      path: "/api/videos/:id/comments",
      description: "Add comment",
    },
    {
      method: "PUT",
      path: "/api/videos/:videoId/comments/:commentId",
      description: "Update comment (DIRECT ROUTE)",
    },
    {
      method: "DELETE",
      path: "/api/videos/:videoId/comments/:commentId",
      description: "Delete comment (DIRECT ROUTE)",
    },
  ];
  res.json({ routes });
});

// MongoDB Connection
const connectDB = async () => {
  try {
    const mongoURI =
      process.env.MONGODB_URI || "mongodb://localhost:27017/youtube-clone";
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error);
    // Don't exit, keep server running for testing
  }
};

// Connect to database
connectDB();

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
  console.log(`✅ Test routes: http://localhost:${PORT}/api/test-routes`);
  console.log(`✅ CORS enabled for all origins`);
});
