import express from "express";
import Video from "../models/Video.js";
import { protect } from "../middleware/auth.js";

const router = express.Router();

// Get all videos
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    let query = {};

    if (search) query.title = { $regex: search, $options: "i" };
    if (category && category !== "All") query.category = category;

    const videos = await Video.find(query)
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName")
      .sort({ createdAt: -1 });

    res.json(videos);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get single video
router.get("/:id", async (req, res) => {
  try {
    const video = await Video.findById(req.params.id)
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName")
      .populate("comments.userId", "username avatar");

    if (!video) return res.status(404).json({ message: "Video not found" });

    video.views += 1;
    await video.save();
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create video
router.post("/", protect, async (req, res) => {
  try {
    const videoData = { ...req.body, uploader: req.user._id };
    const video = await Video.create(videoData);

    const populatedVideo = await Video.findById(video._id)
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName");

    res.status(201).json(populatedVideo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Like video
router.post("/:id/like", protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    const userId = req.user._id;

    if (!video) return res.status(404).json({ message: "Video not found" });

    // Remove from dislikes
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
      likes: video.likes.length,
      dislikes: video.dislikes.length,
      likesArray: video.likes,
      dislikesArray: video.dislikes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Dislike video
router.post("/:id/dislike", protect, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    const userId = req.user._id;

    if (!video) return res.status(404).json({ message: "Video not found" });

    // Remove from likes
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
      likes: video.likes.length,
      dislikes: video.dislikes.length,
      likesArray: video.likes,
      dislikesArray: video.dislikes,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add comment
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const video = await Video.findById(req.params.id);
    if (!video) return res.status(404).json({ message: "Video not found" });

    const comment = {
      userId: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
    };

    video.comments.push(comment);
    await video.save();

    const populatedVideo = await Video.findById(req.params.id).populate(
      "comments.userId",
      "username avatar"
    );

    const newComment =
      populatedVideo.comments[populatedVideo.comments.length - 1];
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
