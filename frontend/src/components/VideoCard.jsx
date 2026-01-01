import React from "react";
import { Link } from "react-router-dom";
import { FaEye, FaClock, FaCalendar, FaUser } from "react-icons/fa";
import "./VideoCard.css";

const VideoCard = ({ video }) => {
  if (!video) {
    return (
      <div className="video-card">
        <div className="video-thumbnail">
          <div className="thumbnail-placeholder">
            <FaEye size={24} />
            <p>Video not available</p>
          </div>
        </div>
        <div className="video-info">
          <h3 className="video-title">Video Not Found</h3>
          <p className="video-description">
            This video is no longer available.
          </p>
        </div>
      </div>
    );
  }

  // Format views
  const formatViews = (views) => {
    if (!views) return "0 views";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M views`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K views`;
    return `${views} views`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "";
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
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch (error) {
      return "Recently";
    }
  };

  // Get channel information safely
  const getChannelInfo = () => {
    if (!video) return { id: null, name: "Unknown Channel", avatar: null };

    const channelInfo = {
      id: null,
      name: "Unknown Channel",
      avatar: "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    };

    // Try channelId object - FIXED: Check for existence and proper structure
    if (video.channelId) {
      if (typeof video.channelId === "object" && video.channelId !== null) {
        channelInfo.id = video.channelId._id || null;
        channelInfo.name =
          video.channelId.channelName ||
          video.channelId.name ||
          "Unknown Channel";
        channelInfo.avatar =
          video.channelId.channelAvatar ||
          video.channelId.avatar ||
          channelInfo.avatar;
      } else if (typeof video.channelId === "string") {
        channelInfo.id = video.channelId;
        // Try to get name from other sources
        if (video.channelIdObject) {
          channelInfo.name =
            video.channelIdObject.channelName || "Unknown Channel";
          channelInfo.avatar =
            video.channelIdObject.channelAvatar || channelInfo.avatar;
        }
      }
    }

    // Try uploader as fallback - ONLY if channelId is not available
    if (!channelInfo.id && video.uploader) {
      if (typeof video.uploader === "object" && video.uploader !== null) {
        channelInfo.id = video.uploader._id || null;
        channelInfo.name = video.uploader.username || "User Channel";
        channelInfo.avatar = video.uploader.avatar || channelInfo.avatar;
      }
    }

    return channelInfo;
  };

  // Validate MongoDB ObjectId
  const isValidObjectId = (id) => {
    if (!id || id === "undefined" || id === "null" || id === "unknown") {
      return false;
    }

    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    return objectIdPattern.test(id);
  };

  const channelInfo = getChannelInfo();
  const canVisitChannel = channelInfo.id && isValidObjectId(channelInfo.id);

  // Handle channel navigation safely
  const handleChannelClick = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!channelInfo.id || !isValidObjectId(channelInfo.id)) {
      console.error("Cannot visit channel: Invalid channel ID", channelInfo.id);
      alert("This channel is not available at the moment.");
      return;
    }

    // Navigate to channel page
    window.location.href = `/channel/${channelInfo.id}`;
  };

  // Handle watch now click
  const handleWatchClick = (e) => {
    if (!video._id) {
      e.preventDefault();
      alert("Video not available");
    }
  };

  return (
    <div className="video-card">
      {/* Thumbnail with Link to Video */}
      <Link
        to={video._id ? `/video/${video._id}` : "#"}
        className="video-thumbnail-link"
        onClick={handleWatchClick}
      >
        <div className="video-thumbnail">
          <img
            src={
              video.thumbnailUrl ||
              "https://via.placeholder.com/320x180?text=No+Thumbnail"
            }
            alt={video.title}
            className="thumbnail-image"
            onError={(e) => {
              e.target.src =
                "https://via.placeholder.com/320x180?text=No+Thumbnail";
            }}
          />
          <div className="video-duration">
            <FaClock /> {video.duration || "0:00"}
          </div>
        </div>
      </Link>

      {/* Video Info */}
      <div className="video-info">
        <h3 className="video-title">
          <Link
            to={video._id ? `/video/${video._id}` : "#"}
            title={video.title}
            onClick={handleWatchClick}
          >
            {video.title || "Untitled Video"}
          </Link>
        </h3>

        <div className="video-meta">
          {canVisitChannel ? (
            <button
              onClick={handleChannelClick}
              className="channel-info-btn"
              title={`Visit ${channelInfo.name}'s channel`}
            >
              <img
                src={channelInfo.avatar}
                alt={channelInfo.name}
                className="channel-avatar"
                onError={(e) => {
                  e.target.src =
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                }}
              />
              <span className="channel-name">{channelInfo.name}</span>
            </button>
          ) : (
            <div className="channel-info">
              <img
                src={channelInfo.avatar}
                alt={channelInfo.name}
                className="channel-avatar"
                onError={(e) => {
                  e.target.src =
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                }}
              />
              <span className="channel-name">{channelInfo.name}</span>
            </div>
          )}
        </div>

        <div className="video-stats">
          <span className="stat">
            <FaEye /> {formatViews(video.views)}
          </span>
          <span className="stat">
            <FaCalendar /> {formatDate(video.createdAt)}
          </span>
        </div>

        {video.description && (
          <p className="video-description">
            {video.description.length > 100
              ? `${video.description.substring(0, 100)}...`
              : video.description}
          </p>
        )}

        {video.tags && video.tags.length > 0 && (
          <div className="video-tags">
            {video.tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="video-actions">
          <Link
            to={video._id ? `/video/${video._id}` : "#"}
            className="btn-watch"
            onClick={handleWatchClick}
          >
            Watch Now
          </Link>
          {canVisitChannel && (
            <button
              onClick={handleChannelClick}
              className="btn-channel"
              title={`Visit ${channelInfo.name}'s channel`}
            >
              Visit Channel
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoCard;
