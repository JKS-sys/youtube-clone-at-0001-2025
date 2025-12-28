import express from "express";
import Video from "../models/Video.js";

const router = express.Router();

// Get all videos with search and filter
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    // Search by title
    if (search) {
      query.title = { $regex: search, $options: "i" };
    }

    // Filter by category
    if (category && category !== "All") {
      query.category = category;
    }

    const videos = await Video.find(query)
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName")
      .sort({ createdAt: -1 });

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single video by ID
router.get("/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName")
      .populate("comments.userId", "username avatar");

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Increment views
    video.views += 1;
    await video.save();

    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create video (will add auth middleware later)
router.post("/", async (req, res) => {
  try {
    const video = await Video.create(req.body);
    res.status(201).json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like a video (protected)
router.post("/:id/like", protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    const userId = req.user._id;

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Remove from dislikes if present
    video.dislikes = video.dislikes.filter(
      (id) => id.toString() !== userId.toString()
    );

    // Toggle like
    const likeIndex = video.likes.findIndex(
      (id) => id.toString() === userId.toString()
    );

    if (likeIndex > -1) {
      video.likes.splice(likeIndex, 1);
    } else {
      video.likes.push(userId);
    }

    await video.save();
    res.json({
      success: true,
      likes: video.likes,
      dislikes: video.dislikes,
    });
  } catch (error) {
    console.error("Error liking video:", error);
    res.status(500).json({ message: error.message });
  }
});

// Dislike a video (protected)
router.post("/:id/dislike", protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    const userId = req.user._id;

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    // Remove from likes if present
    video.likes = video.likes.filter(
      (id) => id.toString() !== userId.toString()
    );

    // Toggle dislike
    const dislikeIndex = video.dislikes.findIndex(
      (id) => id.toString() === userId.toString()
    );

    if (dislikeIndex > -1) {
      video.dislikes.splice(dislikeIndex, 1);
    } else {
      video.dislikes.push(userId);
    }

    await video.save();
    res.json({
      success: true,
      likes: video.likes,
      dislikes: video.dislikes,
    });
  } catch (error) {
    console.error("Error disliking video:", error);
    res.status(500).json({ message: error.message });
  }
});

// Add comment to video (protected)
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const video = await Video.findById(req.params.id);

    if (!video) {
      return res.status(404).json({ message: "Video not found" });
    }

    const comment = {
      userId: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    };

    video.comments.push(comment);
    await video.save();

    // Populate the user info
    const populatedVideo = await Video.findById(req.params.id).populate(
      "comments.userId",
      "username avatar"
    );

    const newComment =
      populatedVideo.comments[populatedVideo.comments.length - 1];

    res.status(201).json(newComment);
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
