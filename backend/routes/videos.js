import express from "express";
import { protect } from "../middleware/auth.js";
import Video from "../models/Video.js";
import Channel from "../models/Channel.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const router = express.Router();

// ✅ Get all videos with search and filter
router.get("/", async (req, res) => {
  try {
    const { search, category, channelId } = req.query;
    let query = { isPublished: true };

    // Apply search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { tags: { $regex: search, $options: "i" } },
      ];
    }

    // Apply category filter
    if (category && category !== "All") {
      query.category = category;
    }

    // Apply channel filter
    if (channelId && mongoose.Types.ObjectId.isValid(channelId)) {
      query.channelId = channelId;
    }

    const videos = await Video.find(query)
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName channelAvatar owner")
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      count: videos.length,
      videos,
    });
  } catch (error) {
    console.error("❌ Error fetching videos:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch videos",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Get single video by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    const video = await Video.findById(id)
      .populate("channelId", "channelName channelAvatar owner")
      .populate("uploader", "username avatar")
      .populate("comments.userId", "username avatar");

    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Increment view count
    video.views += 1;
    await video.save();

    res.json({
      success: true,
      video,
    });
  } catch (error) {
    console.error("❌ Error fetching video:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch video",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Create a new video (PROTECTED)
router.post("/", protect, async (req, res) => {
  try {
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      channelId,
      category,
      tags,
    } = req.body;

    // Validate required fields
    if (!title || !videoUrl || !thumbnailUrl || !channelId) {
      return res.status(400).json({
        success: false,
        message: "Title, video URL, thumbnail URL, and channel ID are required",
      });
    }

    // Check if channel exists and user owns it
    const channel = await Channel.findById(channelId);
    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Verify ownership
    if (channel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to upload to this channel",
      });
    }

    // Create video
    const video = await Video.create({
      title: title.trim(),
      description: description?.trim() || "",
      videoUrl: videoUrl.trim(),
      thumbnailUrl: thumbnailUrl.trim(),
      channelId: channel._id,
      uploader: req.user._id,
      category: category || "Education",
      tags: Array.isArray(tags)
        ? tags
        : tags
            ?.split(",")
            .map((t) => t.trim())
            .filter((t) => t) || [],
      isPublished: true,
    });

    // Add video to channel
    channel.videos.push(video._id);
    await channel.save();

    // Populate response
    const populatedVideo = await Video.findById(video._id)
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName channelAvatar");

    res.status(201).json({
      success: true,
      message: "Video created successfully",
      video: populatedVideo,
    });
  } catch (error) {
    console.error("❌ Error creating video:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create video",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Update video (PROTECTED)
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      videoUrl,
      thumbnailUrl,
      category,
      tags,
      isPublished,
    } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check if user owns the video
    if (video.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this video",
      });
    }

    // Update video
    const updateData = {};
    if (title !== undefined) updateData.title = title.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (videoUrl !== undefined) updateData.videoUrl = videoUrl.trim();
    if (thumbnailUrl !== undefined)
      updateData.thumbnailUrl = thumbnailUrl.trim();
    if (category !== undefined) updateData.category = category;
    if (tags !== undefined) {
      updateData.tags = Array.isArray(tags)
        ? tags
        : tags
            .split(",")
            .map((t) => t.trim())
            .filter((t) => t);
    }
    if (isPublished !== undefined) updateData.isPublished = isPublished;

    const updatedVideo = await Video.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName channelAvatar");

    res.json({
      success: true,
      message: "Video updated successfully",
      video: updatedVideo,
    });
  } catch (error) {
    console.error("❌ Error updating video:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update video",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Delete video (PROTECTED)
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    // Check if user owns the video
    if (video.uploader.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this video",
      });
    }

    // Remove video from channel
    await Channel.findByIdAndUpdate(video.channelId, {
      $pull: { videos: video._id },
    });

    // Delete video
    await video.deleteOne();

    res.json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting video:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete video",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Like video (PROTECTED)
router.post("/:id/like", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const userId = req.user._id;
    const isLiked = video.likes.some(
      (likeId) => likeId.toString() === userId.toString()
    );

    if (isLiked) {
      // Remove like
      video.likes = video.likes.filter(
        (likeId) => likeId.toString() !== userId.toString()
      );
    } else {
      // Add like and remove dislike if exists
      video.likes.push(userId);
      video.dislikes = video.dislikes.filter(
        (dislikeId) => dislikeId.toString() !== userId.toString()
      );
    }

    await video.save();

    res.json({
      success: true,
      message: isLiked ? "Video unliked" : "Video liked",
      likes: video.likes,
      dislikes: video.dislikes,
      likesArray: video.likes,
      dislikesArray: video.dislikes,
      likesCount: video.likes.length,
      dislikesCount: video.dislikes.length,
    });
  } catch (error) {
    console.error("❌ Error liking video:", error);
    res.status(500).json({
      success: false,
      message: "Failed to like video",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Dislike video (PROTECTED)
router.post("/:id/dislike", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const userId = req.user._id;
    const isDisliked = video.dislikes.some(
      (dislikeId) => dislikeId.toString() === userId.toString()
    );

    if (isDisliked) {
      // Remove dislike
      video.dislikes = video.dislikes.filter(
        (dislikeId) => dislikeId.toString() !== userId.toString()
      );
    } else {
      // Add dislike and remove like if exists
      video.dislikes.push(userId);
      video.likes = video.likes.filter(
        (likeId) => likeId.toString() !== userId.toString()
      );
    }

    await video.save();

    res.json({
      success: true,
      message: isDisliked ? "Dislike removed" : "Video disliked",
      likes: video.likes,
      dislikes: video.dislikes,
      likesArray: video.likes,
      dislikesArray: video.dislikes,
      likesCount: video.likes.length,
      dislikesCount: video.dislikes.length,
    });
  } catch (error) {
    console.error("❌ Error disliking video:", error);
    res.status(500).json({
      success: false,
      message: "Failed to dislike video",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ... (keep existing video routes) ...

// ✅ Add comment to video (PROTECTED)
router.post("/:id/comments", protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const video = await Video.findById(id);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const comment = {
      userId: req.user._id,
      text: text.trim(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    video.comments.push(comment);
    await video.save();

    // Get populated comment with user info
    const populatedVideo = await Video.findById(id).populate({
      path: "comments.userId",
      select: "username avatar",
    });

    const newComment =
      populatedVideo.comments[populatedVideo.comments.length - 1];

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: newComment,
    });
  } catch (error) {
    console.error("❌ Error adding comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Update comment (PROTECTED)
router.put("/:videoId/comments/:commentId", protect, async (req, res) => {
  try {
    const { videoId, commentId } = req.params;
    const { text } = req.body;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
    }

    if (!text || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const comment = video.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user owns the comment
    if (comment.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this comment",
      });
    }

    comment.text = text.trim();
    comment.updatedAt = new Date();
    await video.save();

    // Populate user info
    const populatedVideo = await Video.findById(videoId).populate({
      path: "comments.userId",
      select: "username avatar",
    });

    const updatedComment = populatedVideo.comments.id(commentId);

    res.json({
      success: true,
      message: "Comment updated successfully",
      comment: updatedComment,
    });
  } catch (error) {
    console.error("❌ Error updating comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Delete comment (PROTECTED)
router.delete("/:videoId/comments/:commentId", protect, async (req, res) => {
  try {
    const { videoId, commentId } = req.params;

    if (!videoId || !mongoose.Types.ObjectId.isValid(videoId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid video ID",
      });
    }

    if (!commentId || !mongoose.Types.ObjectId.isValid(commentId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid comment ID",
      });
    }

    const video = await Video.findById(videoId);
    if (!video) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const comment = video.comments.id(commentId);
    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user owns the comment OR is the video owner
    const isCommentOwner =
      comment.userId.toString() === req.user._id.toString();
    const isVideoOwner = video.uploader.toString() === req.user._id.toString();

    if (!isCommentOwner && !isVideoOwner) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment",
      });
    }

    video.comments.pull(commentId);
    await video.save();

    res.json({
      success: true,
      message: "Comment deleted successfully",
    });
  } catch (error) {
    console.error("❌ Error deleting comment:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
