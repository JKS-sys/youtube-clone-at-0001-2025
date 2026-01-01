// Utility functions for channel operations
export const isValidChannelId = (channelId) => {
  if (!channelId) return false;

  // Reject common invalid values
  if (["undefined", "null", "unknown", ""].includes(channelId)) {
    return false;
  }

  // Accept MongoDB ObjectId format (24 hex characters)
  const objectIdPattern = /^[0-9a-fA-F]{24}$/;
  if (objectIdPattern.test(channelId)) {
    return true;
  }

  // Also accept other string IDs that might come from the database
  return typeof channelId === "string" && channelId.length > 10;
};

export const normalizeChannelId = (channelId) => {
  if (!channelId) return null;

  // If it's an object with _id property
  if (typeof channelId === "object" && channelId._id) {
    return channelId._id;
  }

  // If it's already a string
  if (typeof channelId === "string") {
    return channelId;
  }

  return null;
};

export const getChannelFromVideo = (video) => {
  if (!video) return null;

  // Try different possible channel locations
  if (video.channelId) {
    return normalizeChannelId(video.channelId);
  }

  if (video.channel) {
    return normalizeChannelId(video.channel);
  }

  if (video.uploader && video.uploader.channels && video.uploader.channels[0]) {
    return video.uploader.channels[0];
  }

  if (video.uploader) {
    return normalizeChannelId(video.uploader);
  }

  return null;
};

export const getChannelName = (video) => {
  if (!video) return "Unknown Channel";

  if (video.channelId && typeof video.channelId === "object") {
    return (
      video.channelId.channelName || video.channelId.name || "Unknown Channel"
    );
  }

  if (video.channel && typeof video.channel === "object") {
    return video.channel.channelName || video.channel.name || "Unknown Channel";
  }

  if (video.uploader && typeof video.uploader === "object") {
    return video.uploader.username || "User Channel";
  }

  return "Unknown Channel";
};

export const getChannelAvatar = (video) => {
  const defaultAvatar = "https://cdn-icons-png.flaticon.com/512/149/149071.png";

  if (!video) return defaultAvatar;

  if (video.channelId && typeof video.channelId === "object") {
    return (
      video.channelId.channelAvatar || video.channelId.avatar || defaultAvatar
    );
  }

  if (video.channel && typeof video.channel === "object") {
    return video.channel.channelAvatar || video.channel.avatar || defaultAvatar;
  }

  if (video.uploader && typeof video.uploader === "object") {
    return video.uploader.avatar || defaultAvatar;
  }

  return defaultAvatar;
};

// Format numbers for display
export const formatNumber = (num) => {
  if (!num && num !== 0) return "0";
  const n = Number(num);
  if (isNaN(n)) return "0";
  if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toString();
};

// Format date
export const formatDate = (dateString) => {
  if (!dateString) return "Unknown";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid date";
  }
};

// Check if current user is channel owner
export const isChannelOwner = (channel, user) => {
  if (!user || !channel) return false;
  if (!user._id) return false;

  const userId = user._id.toString();

  // Check via channel.owner field
  if (channel.owner) {
    if (channel.owner._id) {
      return channel.owner._id.toString() === userId;
    }
    if (typeof channel.owner === "string") {
      return channel.owner === userId;
    }
  }

  // Check via user's channels array
  try {
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.channels && Array.isArray(parsedUser.channels)) {
        return parsedUser.channels.some(
          (channelId) => channelId.toString() === channel._id.toString()
        );
      }
    }
  } catch (err) {
    console.error("Error checking user channels:", err);
  }

  return false;
};
