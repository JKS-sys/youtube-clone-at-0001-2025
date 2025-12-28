import express from "express";
import { protect } from "../middleware/auth.js";
import Channel from "../models/Channel.js";
import Video from "../models/Video.js";
import User from "../models/User.js";

const router = express.Router();

router.get("/check", protect, async (req, res) => {
  try {
    const channel = await Channel.findOne({ owner: req.user._id });

    if (channel) {
      return res.json({
        hasChannel: true,
        channel: {
          _id: channel._id,
          channelName: channel.channelName,
          description: channel.description,
        },
      });
    }

    res.json({
      hasChannel: false,
      message: "User does not have a channel",
    });
  } catch (error) {
    console.error("Error checking channel:", error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/", protect, async (req, res) => {
  try {
    const { channelName, description, channelBanner } = req.body;

    // Step 1: Check if user already has a channel
    const existingChannel = await Channel.findOne({ owner: req.user._id });
    if (existingChannel) {
      return res.status(400).json({
        message:
          "You already have a channel. You can only create one channel per account.",
        existingChannel: {
          _id: existingChannel._id,
          channelName: existingChannel.channelName,
        },
      });
    }

    // Step 2: Validate input
    if (!channelName || channelName.trim().length < 3) {
      return res.status(400).json({
        message: "Channel name must be at least 3 characters long",
      });
    }

    if (channelName.trim().length > 50) {
      return res.status(400).json({
        message: "Channel name cannot exceed 50 characters",
      });
    }

    // Step 3: Check if channel name is available globally
    const channelNameExists = await Channel.findOne({
      channelName: { $regex: new RegExp(`^${channelName.trim()}$`, "i") },
    });

    if (channelNameExists) {
      return res.status(400).json({
        message: "Channel name already exists. Please choose a different name.",
      });
    }

    // Step 4: Create the channel
    const channel = await Channel.create({
      channelName: channelName.trim(),
      owner: req.user._id,
      description: description?.trim() || "",
      channelBanner: channelBanner?.trim() || "",
    });

    // Step 5: Update user's hasChannel flag
    await User.findByIdAndUpdate(req.user._id, {
      $push: { channels: channel._id },
      $set: { hasChannel: true },
    });

    // Step 6: Return populated channel
    const populatedChannel = await Channel.findById(channel._id).populate(
      "owner",
      "username avatar"
    );

    console.log(
      `✅ Channel "${channel.channelName}" created for user: ${req.user.username}`
    );

    res.status(201).json({
      message: "Channel created successfully",
      channel: populatedChannel,
    });
  } catch (error) {
    console.error("❌ Error creating channel:", error);

    if (error.code === 11000) {
      return res.status(400).json({
        message: "Channel creation failed. You may already have a channel.",
      });
    }

    res.status(500).json({
      message: "Failed to create channel. Please try again.",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get channel by ID
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid channel ID format",
      });
    }

    const channel = await Channel.findById(id)
      .populate("owner", "username avatar")
      .populate("subscribers", "username avatar");

    if (!channel) {
      return res.status(404).json({
        message: "Channel not found",
      });
    }

    // Get videos for this channel
    const videos = await Video.find({ channelId: id })
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName")
      .sort({ createdAt: -1 });

    const response = {
      ...channel.toObject(),
      videos: videos,
      videoCount: videos.length,
      subscriberCount: channel.subscribers?.length || 0,
      hasChannel: true,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching channel:", error);
    res.status(500).json({
      message: "Failed to fetch channel",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get user's channel
router.get("/user/me", protect, async (req, res) => {
  try {
    const channel = await Channel.findOne({ owner: req.user._id })
      .populate("owner", "username avatar")
      .populate("subscribers", "username avatar");

    if (!channel) {
      return res.status(404).json({
        message: "You don't have a channel yet",
        hasChannel: false,
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
      subscriberCount: channel.subscribers?.length || 0,
      hasChannel: true,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching user channel:", error);
    res.status(500).json({
      message: "Failed to fetch your channel",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get channels by user ID
router.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        message: "Invalid user ID format",
      });
    }

    const channels = await Channel.find({ owner: userId })
      .populate("owner", "username avatar")
      .sort({ createdAt: -1 });

    res.json(channels);
  } catch (error) {
    console.error("Error fetching user channels:", error);
    res.status(500).json({
      message: "Failed to fetch user channels",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
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
        _id: { $ne: channel._id },
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

    res.json({
      message: "Channel updated successfully",
      channel: updatedChannel,
    });
  } catch (error) {
    console.error("Error updating channel:", error);
    res.status(500).json({
      message: "Failed to update channel",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
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
      $set: { hasChannel: false },
    });

    await channel.deleteOne();

    console.log(
      `✅ Channel "${channel.channelName}" deleted by user: ${req.user.username}`
    );

    res.json({
      message: "Channel deleted successfully",
      deletedChannelId: channel._id,
    });
  } catch (error) {
    console.error("Error deleting channel:", error);
    res.status(500).json({
      message: "Failed to delete channel",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
