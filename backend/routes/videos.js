import express from "express";
import Video from "../models/Video.js";
import Channel from "../models/Channel.js";
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
      .populate("channelId", "channelName description owner")
      .populate("likes", "username avatar")
      .populate("dislikes", "username avatar")
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
      .populate("channelId", "channelName description owner")
      .populate("likes", "username avatar")
      .populate("dislikes", "username avatar")
      .populate("comments.userId", "username avatar");

    if (!video) return res.status(404).json({ message: "Video not found" });

    video.views += 1;
    await video.save();
    res.json(video);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create video - FIXED: Now properly links video to channel
router.post("/", protect, async (req, res) => {
  try {
    const { channelId, ...videoData } = req.body;

    // Validate channel exists and user owns it
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    if (channel.owner.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorized to upload to this channel" });
    }

    const video = await Video.create({
      ...videoData,
      channelId,
      uploader: req.user._id,
    });

    // Add video to channel's videos array
    channel.videos.push(video._id);
    await channel.save();

    const populatedVideo = await Video.findById(video._id)
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName description owner")
      .populate("likes", "username avatar")
      .populate("dislikes", "username avatar");

    res.status(201).json(populatedVideo);
  } catch (error) {
    console.error("Error creating video:", error);
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

    // Populate likes and dislikes
    const updatedVideo = await Video.findById(req.params.id)
      .populate("likes", "username avatar")
      .populate("dislikes", "username avatar");

    res.json({
      success: true,
      likes: updatedVideo.likes.length,
      dislikes: updatedVideo.dislikes.length,
      likesArray: updatedVideo.likes.map((user) => user._id),
      dislikesArray: updatedVideo.dislikes.map((user) => user._id),
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

    // Populate likes and dislikes
    const updatedVideo = await Video.findById(req.params.id)
      .populate("likes", "username avatar")
      .populate("dislikes", "username avatar");

    res.json({
      success: true,
      likes: updatedVideo.likes.length,
      dislikes: updatedVideo.dislikes.length,
      likesArray: updatedVideo.likes.map((user) => user._id),
      dislikesArray: updatedVideo.dislikes.map((user) => user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update video
router.put("/:id", protect, async (req, res) => {
  try {
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
      .populate("channelId", "channelName description owner")
      .populate("likes", "username avatar")
      .populate("dislikes", "username avatar");

    res.json(updatedVideo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete video
router.delete("/:id", protect, async (req, res) => {
  try {
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

    // Remove video from channel's videos array
    const channel = await Channel.findById(video.channelId);
    if (channel) {
      channel.videos = channel.videos.filter(
        (vidId) => vidId.toString() !== video._id.toString()
      );
      await channel.save();
    }

    await video.deleteOne();
    res.json({ message: "Video deleted successfully" });
  } catch (error) {
    console.error("Error deleting video:", error);
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

// Update comment
router.put("/:videoId/comments/:commentId", protect, async (req, res) => {
  try {
    const { videoId, commentId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

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
    res.status(500).json({ message: error.message });
  }
});

// Delete comment
router.delete("/:videoId/comments/:commentId", protect, async (req, res) => {
  try {
    const { videoId, commentId } = req.params;

    const video = await Video.findById(videoId);
    if (!video) return res.status(404).json({ message: "Video not found" });

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
    res.status(500).json({ message: error.message });
  }
});

export default router;
