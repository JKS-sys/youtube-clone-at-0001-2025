import express from "express";
import { protect } from "../middleware/auth.js";
import Channel from "../models/Channel.js";
import Video from "../models/Video.js";
import User from "../models/User.js";
import mongoose from "mongoose";

const router = express.Router();

// ✅ Get all channels
router.get("/", async (req, res) => {
  try {
    const { search, limit = 20 } = req.query;
    let query = {};

    if (search) {
      query.channelName = { $regex: search, $options: "i" };
    }

    const channels = await Channel.find(query)
      .populate("owner", "username avatar")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      count: channels.length,
      channels: channels,
    });
  } catch (error) {
    console.error("❌ Error fetching channels:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch channels",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Get channel by ID or name
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    // Check if ID is provided
    if (!id || id === "undefined" || id === "null") {
      return res.status(400).json({
        success: false,
        message: "Channel ID is required",
      });
    }

    console.log(`📡 Fetching channel with ID/name: ${id}`);

    let channel = null;

    // Try to find by ID first (if it's a valid MongoDB ObjectId)
    if (mongoose.Types.ObjectId.isValid(id)) {
      channel = await Channel.findById(id)
        .populate("owner", "username avatar email")
        .populate("subscribers", "username avatar");
    }

    // If not found by ID, try by channel name (case-insensitive)
    if (!channel) {
      channel = await Channel.findOne({
        channelName: new RegExp(`^${id}$`, "i"),
      })
        .populate("owner", "username avatar email")
        .populate("subscribers", "username avatar");
    }

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
        details: "No channel exists with the provided ID or name",
      });
    }

    // Get videos for this channel
    const videos = await Video.find({
      channelId: channel._id,
      isPublished: true,
    })
      .populate("uploader", "username avatar")
      .populate("channelId", "channelName channelAvatar")
      .sort({ createdAt: -1 })
      .limit(50);

    // Calculate total views
    const totalViews = videos.reduce(
      (sum, video) => sum + (video.views || 0),
      0
    );

    // Calculate subscriber count
    const subscriberCount = channel.subscribers?.length || 0;

    // Prepare response
    const response = {
      success: true,
      channel: {
        _id: channel._id,
        channelName: channel.channelName,
        owner: channel.owner,
        description: channel.description,
        channelBanner: channel.channelBanner,
        channelAvatar: channel.channelAvatar,
        subscribers: channel.subscribers,
        videos: videos,
        totalViews: totalViews,
        videoCount: videos.length,
        subscriberCount: subscriberCount,
        verified: channel.verified || false,
        website: channel.website,
        location: channel.location,
        socialLinks: channel.socialLinks,
        customLinks: channel.customLinks,
        createdAt: channel.createdAt,
        updatedAt: channel.updatedAt,
      },
    };

    res.json(response);
  } catch (error) {
    console.error("❌ Error fetching channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch channel",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Create a new channel
router.post("/", protect, async (req, res) => {
  try {
    const { channelName, description, channelBanner } = req.body;

    // Check if user already has a channel
    const existingChannel = await Channel.findOne({ owner: req.user._id });
    if (existingChannel) {
      return res.status(400).json({
        success: false,
        message: "You already have a channel",
        existingChannel: {
          _id: existingChannel._id,
          channelName: existingChannel.channelName,
        },
      });
    }

    // Validate input
    if (!channelName || channelName.trim().length < 3) {
      return res.status(400).json({
        success: false,
        message: "Channel name must be at least 3 characters long",
      });
    }

    // Check if channel name is available
    const channelExists = await Channel.findOne({
      channelName: { $regex: new RegExp(`^${channelName.trim()}$`, "i") },
    });

    if (channelExists) {
      return res.status(400).json({
        success: false,
        message: "Channel name already exists",
      });
    }

    // Create channel
    const channel = await Channel.create({
      channelName: channelName.trim(),
      owner: req.user._id,
      description: description?.trim() || "",
      channelBanner: channelBanner?.trim() || "https://picsum.photos/1200/300",
      channelAvatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(
        channelName.trim()
      )}&background=random&color=fff&bold=true`,
    });

    // Update user
    await User.findByIdAndUpdate(req.user._id, {
      $push: { channels: channel._id },
      $set: { hasChannel: true },
    });

    // Populate and return
    const populatedChannel = await Channel.findById(channel._id).populate(
      "owner",
      "username avatar"
    );

    res.status(201).json({
      success: true,
      message: "Channel created successfully",
      channel: populatedChannel,
    });
  } catch (error) {
    console.error("❌ Error creating channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create channel",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Get user's channel (for management)
router.get("/user/me", protect, async (req, res) => {
  try {
    const channel = await Channel.findOne({ owner: req.user._id }).populate(
      "owner",
      "username avatar email"
    );

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "You don't have a channel yet",
        hasChannel: false,
      });
    }

    // Get all videos for this channel
    const videos = await Video.find({ channelId: channel._id })
      .populate("uploader", "username avatar")
      .sort({ createdAt: -1 });

    // Calculate total views
    const totalViews = videos.reduce(
      (sum, video) => sum + (video.views || 0),
      0
    );

    // Get subscriber count
    const subscriberCount = channel.subscribers?.length || 0;

    const response = {
      success: true,
      hasChannel: true,
      channel: {
        ...channel.toObject(),
        videoCount: videos.length,
        subscriberCount: subscriberCount,
        totalViews: totalViews,
      },
      videos: videos,
    };

    res.json(response);
  } catch (error) {
    console.error("❌ Error fetching user channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch your channel",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Update channel settings
router.put("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID",
      });
    }

    const channel = await Channel.findById(id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check ownership
    if (channel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this channel",
      });
    }

    // Check if new channel name is available
    if (req.body.channelName && req.body.channelName !== channel.channelName) {
      const existingChannel = await Channel.findOne({
        channelName: req.body.channelName,
        _id: { $ne: channel._id },
      });
      if (existingChannel) {
        return res.status(400).json({
          success: false,
          message: "Channel name already exists",
        });
      }
    }

    const updatedChannel = await Channel.findByIdAndUpdate(
      id,
      {
        ...req.body,
        channelName: req.body.channelName?.trim(),
        description: req.body.description?.trim() || channel.description,
        channelBanner: req.body.channelBanner?.trim() || channel.channelBanner,
        updatedAt: new Date(),
      },
      { new: true, runValidators: true }
    ).populate("owner", "username avatar");

    res.json({
      success: true,
      message: "Channel updated successfully",
      channel: updatedChannel,
    });
  } catch (error) {
    console.error("❌ Error updating channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update channel",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Delete channel
router.delete("/:id", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID",
      });
    }

    const channel = await Channel.findById(id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check ownership
    if (channel.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this channel",
      });
    }

    // Delete all videos in the channel
    await Video.deleteMany({ channelId: channel._id });

    // Remove channel from user
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { channels: channel._id },
      $set: { hasChannel: false },
    });

    await channel.deleteOne();

    res.json({
      success: true,
      message: "Channel deleted successfully",
      deletedChannelId: channel._id,
    });
  } catch (error) {
    console.error("❌ Error deleting channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete channel",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Subscribe to channel
router.post("/:id/subscribe", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID",
      });
    }

    const channel = await Channel.findById(id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check if already subscribed
    if (channel.subscribers.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "Already subscribed to this channel",
      });
    }

    // Add subscriber
    channel.subscribers.push(req.user._id);
    await channel.save();

    res.json({
      success: true,
      message: "Subscribed successfully",
      subscriberCount: channel.subscribers.length,
    });
  } catch (error) {
    console.error("❌ Error subscribing to channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to subscribe",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// ✅ Unsubscribe from channel
router.delete("/:id/subscribe", protect, async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid channel ID",
      });
    }

    const channel = await Channel.findById(id);

    if (!channel) {
      return res.status(404).json({
        success: false,
        message: "Channel not found",
      });
    }

    // Check if subscribed
    if (!channel.subscribers.includes(req.user._id)) {
      return res.status(400).json({
        success: false,
        message: "Not subscribed to this channel",
      });
    }

    // Remove subscriber
    channel.subscribers = channel.subscribers.filter(
      (subId) => subId.toString() !== req.user._id.toString()
    );
    await channel.save();

    res.json({
      success: true,
      message: "Unsubscribed successfully",
      subscriberCount: channel.subscribers.length,
    });
  } catch (error) {
    console.error("❌ Error unsubscribing from channel:", error);
    res.status(500).json({
      success: false,
      message: "Failed to unsubscribe",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

export default router;
