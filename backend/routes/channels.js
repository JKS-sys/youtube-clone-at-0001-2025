import express from "express";
import { protect } from "../middleware/auth.js";
import Channel from "../models/Channel.js";
import Video from "../models/Video.js";
import User from "../models/User.js";

const router = express.Router();

// Create a new channel
router.post("/", protect, async (req, res) => {
  try {
    const { channelName, description, channelBanner } = req.body;

    // Validate input
    if (!channelName || channelName.trim().length < 3) {
      return res.status(400).json({
        message: "Channel name must be at least 3 characters long",
      });
    }

    const channelExists = await Channel.findOne({
      channelName: channelName.trim(),
    });
    if (channelExists) {
      return res.status(400).json({
        message: "Channel name already exists. Please choose a different name.",
      });
    }

    const channel = await Channel.create({
      channelName: channelName.trim(),
      owner: req.user._id,
      description: description?.trim() || "",
      channelBanner: channelBanner?.trim() || "",
    });

    // Add channel to user's channels array
    await User.findByIdAndUpdate(
      req.user._id,
      { $push: { channels: channel._id } },
      { new: true }
    );

    // Return populated channel
    const populatedChannel = await Channel.findById(channel._id).populate(
      "owner",
      "username avatar"
    );

    console.log("✅ Channel created:", populatedChannel);

    res.status(201).json(populatedChannel);
  } catch (error) {
    console.error("❌ Error creating channel:", error);
    res.status(500).json({
      message: "Failed to create channel. Please try again.",
    });
  }
});

// Get channel by ID - FIXED with better error handling
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    console.log("📡 Fetching channel with ID:", id);

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid channel ID format",
      });
    }

    const channel = await Channel.findById(id)
      .populate("owner", "username avatar")
      .populate("subscribers", "username avatar");

    if (!channel) {
      console.log("❌ Channel not found:", id);
      return res.status(404).json({
        message: "Channel not found. It may have been deleted.",
      });
    }

    // Get videos for this channel
    const videos = await Video.find({ channelId: id })
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName")
      .populate("likes", "username avatar")
      .populate("dislikes", "username avatar")
      .sort({ createdAt: -1 });

    // Create response object
    const response = {
      ...channel.toObject(),
      videos: videos,
      videoCount: videos.length,
      subscriberCount: channel.subscribers?.length || 0,
    };

    console.log(
      "✅ Channel found:",
      channel.channelName,
      "Videos:",
      videos.length
    );

    res.json(response);
  } catch (error) {
    console.error("❌ Error fetching channel:", error);
    res.status(500).json({
      message: "Failed to fetch channel. Please try again.",
    });
  }
});

// Get channel by channel name
router.get("/name/:channelName", async (req, res) => {
  try {
    const { channelName } = req.params;
    console.log("📡 Fetching channel by name:", channelName);

    const channel = await Channel.findOne({
      channelName: new RegExp(`^${channelName}$`, "i"),
    })
      .populate("owner", "username avatar")
      .populate("subscribers", "username avatar");

    if (!channel) {
      return res.status(404).json({
        message: "Channel not found",
      });
    }

    // Get videos for this channel
    const videos = await Video.find({ channelId: channel._id })
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName")
      .sort({ createdAt: -1 });

    const response = {
      ...channel.toObject(),
      videos: videos,
      videoCount: videos.length,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching channel by name:", error);
    res.status(500).json({ message: error.message });
  }
});

// Get user's channels
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("📡 Fetching channels for user:", userId);

    // Validate ObjectId format
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid user ID format",
      });
    }

    const channels = await Channel.find({ owner: userId })
      .populate("owner", "username avatar")
      .sort({ createdAt: -1 });

    console.log("✅ Found", channels.length, "channels for user");

    res.json(channels);
  } catch (error) {
    console.error("❌ Error fetching user channels:", error);
    res.status(500).json({
      message: "Failed to fetch user channels",
    });
  }
});

// Update channel
router.put("/:id", protect, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if user owns the channel
    if (channel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to edit this channel",
      });
    }

    // Check if new channel name already exists (if being changed)
    if (req.body.channelName && req.body.channelName !== channel.channelName) {
      const existingChannel = await Channel.findOne({
        channelName: req.body.channelName,
      });
      if (existingChannel) {
        return res.status(400).json({
          message: "Channel name already exists",
        });
      }
    }

    const updatedChannel = await Channel.findByIdAndUpdate(
      req.params.id,
      {
        ...req.body,
        channelName: req.body.channelName?.trim(),
        description: req.body.description?.trim() || channel.description,
        channelBanner: req.body.channelBanner?.trim() || channel.channelBanner,
      },
      { new: true, runValidators: true }
    )
      .populate("owner", "username avatar")
      .populate("subscribers", "username avatar");

    res.json(updatedChannel);
  } catch (error) {
    console.error("Error updating channel:", error);
    res.status(500).json({ message: error.message });
  }
});

// Delete channel
router.delete("/:id", protect, async (req, res) => {
  try {
    const channel = await Channel.findById(req.params.id);

    if (!channel) {
      return res.status(404).json({ message: "Channel not found" });
    }

    // Check if user owns the channel
    if (channel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: "Not authorized to delete this channel",
      });
    }

    // Delete all videos in the channel
    await Video.deleteMany({ channelId: channel._id });

    // Remove channel from user's channels array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { channels: channel._id },
    });

    await channel.deleteOne();

    console.log("✅ Channel deleted:", channel.channelName);

    res.json({
      message: "Channel deleted successfully",
      deletedChannelId: channel._id,
    });
  } catch (error) {
    console.error("Error deleting channel:", error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
