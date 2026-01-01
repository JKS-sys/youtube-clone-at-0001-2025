import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { videoAPI, channelAPI } from "../services/api";
import LikeDislikeButtons from "../components/LikeDislikeButtons";
import CommentSection from "../components/CommentSection";
import {
  FaArrowLeft,
  FaUserCircle,
  FaYoutube,
  FaExternalLinkAlt,
  FaSpinner,
  FaExclamationTriangle,
  FaPlay,
  FaEye,
  FaCalendar,
  FaTag,
  FaShare,
  FaDownload,
  FaBookmark,
  FaFlag,
  FaThumbsUp,
  FaThumbsDown,
  FaComments,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaUser,
} from "react-icons/fa";
import "./VideoPlayer.css";

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playerError, setPlayerError] = useState(false);
  const [showFallbackPlayer, setShowFallbackPlayer] = useState(false);
  const [user, setUser] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [channel, setChannel] = useState(null);

  // Get current user
  useEffect(() => {
    const getUser = () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData && userData !== "undefined") {
          return JSON.parse(userData);
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        return null;
      }
      return null;
    };
    setUser(getUser());
  }, []);

  // Fetch video data
  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError("");
        console.log("📡 Fetching video:", id);

        const response = await videoAPI.getVideo(id);
        console.log("📦 Video data received:", response.data);

        if (!response.data || !response.data.video) {
          throw new Error("Video not found");
        }

        const videoData = response.data.video;
        setVideo(videoData);

        // Check if video URL is valid
        if (!videoData.videoUrl) {
          setError("Video URL is missing");
          setPlayerError(true);
        }

        // If video has channel info, fetch channel details
        if (videoData.channelId) {
          fetchChannelDetails(videoData.channelId);
        }

        // Check if user is subscribed to channel
        if (user && videoData.channelId) {
          checkSubscription(videoData.channelId._id || videoData.channelId);
        }
      } catch (err) {
        console.error("❌ Error fetching video:", err);
        setError(
          err.response?.data?.message || err.message || "Failed to load video"
        );
        setPlayerError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id && id !== "undefined" && id !== "null") {
      fetchVideo();
    } else {
      setError("Invalid video ID");
      setLoading(false);
    }
  }, [id, user]);

  // Fetch channel details
  const fetchChannelDetails = async (channelId) => {
    try {
      const channelResponse = await channelAPI.getChannel(
        typeof channelId === "object" ? channelId._id : channelId
      );
      if (channelResponse.data && channelResponse.data.channel) {
        setChannel(channelResponse.data.channel);
      }
    } catch (error) {
      console.error("Error fetching channel details:", error);
    }
  };

  // Check subscription status
  const checkSubscription = async (channelId) => {
    try {
      const channelResponse = await channelAPI.getChannel(channelId);
      if (channelResponse.data && channelResponse.data.channel) {
        const channelData = channelResponse.data.channel;
        if (channelData.subscribers && user) {
          const subscribed = channelData.subscribers.some(
            (sub) =>
              (sub._id && sub._id.toString() === user._id?.toString()) ||
              sub.toString() === user._id?.toString()
          );
          setIsSubscribed(subscribed);
        }
      }
    } catch (error) {
      console.error("Error checking subscription:", error);
    }
  };

  // Get safe video URL for different formats
  const getSafeVideoUrl = (videoUrl) => {
    if (!videoUrl) return null;

    try {
      // If it's already a valid URL, return it
      if (videoUrl.startsWith("http://") || videoUrl.startsWith("https://")) {
        return videoUrl;
      }

      // If it's a YouTube ID without embed format
      if (videoUrl.length === 11 && !videoUrl.includes("/")) {
        return `https://www.youtube.com/embed/${videoUrl}`;
      }

      // Try to extract YouTube video ID from various formats
      const youtubeIdPatterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
        /^([a-zA-Z0-9_-]{11})$/,
      ];

      for (const pattern of youtubeIdPatterns) {
        const match = videoUrl.match(pattern);
        if (match && match[1]) {
          return `https://www.youtube.com/embed/${match[1]}?rel=0&modestbranding=1&autoplay=1`;
        }
      }

      // If it looks like a direct video file
      if (
        videoUrl.includes(".mp4") ||
        videoUrl.includes(".webm") ||
        videoUrl.includes(".avi")
      ) {
        return videoUrl;
      }

      return videoUrl;
    } catch (error) {
      console.error("Error processing video URL:", error);
      return videoUrl;
    }
  };

  // Handle video data update (for likes/dislikes)
  const handleVideoUpdate = (updatedData) => {
    console.log("🔄 Updating video data:", updatedData);
    setVideo((prev) => ({
      ...prev,
      ...updatedData,
    }));
  };

  // Handle comments update
  const handleCommentsUpdate = async () => {
    try {
      const response = await videoAPI.getVideo(id);
      setVideo((prev) => ({
        ...prev,
        comments: response.data.video.comments,
      }));
    } catch (err) {
      console.error("Error updating comments:", err);
    }
  };

  // Handle subscribe/unsubscribe
  const handleSubscribe = async () => {
    if (!user) {
      alert("Please login to subscribe to channels");
      navigate("/auth");
      return;
    }

    if (!video || !video.channelId) {
      alert("Channel not found");
      return;
    }

    try {
      setSubscribing(true);
      const channelId = video.channelId._id || video.channelId;

      if (isSubscribed) {
        await channelAPI.unsubscribe(channelId);
        setIsSubscribed(false);
        alert("Unsubscribed from channel");
      } else {
        await channelAPI.subscribe(channelId);
        setIsSubscribed(true);
        alert("Subscribed to channel!");
      }

      // Update channel subscriber count
      if (channel) {
        setChannel((prev) => ({
          ...prev,
          subscriberCount: isSubscribed
            ? Math.max(0, (prev.subscriberCount || 1) - 1)
            : (prev.subscriberCount || 0) + 1,
        }));
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      alert(error.message || "Failed to update subscription");
    } finally {
      setSubscribing(false);
    }
  };

  // Format numbers for display
  const formatViews = (views) => {
    if (!views) return "0 views";
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return "Recently";
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return "Today";
      if (diffDays === 1) return "Yesterday";
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch (error) {
      return "Recently";
    }
  };

  // Get channel ID safely
  const getChannelId = () => {
    if (!video) return null;

    if (video.channelId) {
      if (typeof video.channelId === "object") {
        return video.channelId._id;
      }
      return video.channelId;
    }

    if (
      video.uploader &&
      video.uploader.channels &&
      video.uploader.channels[0]
    ) {
      return video.uploader.channels[0];
    }

    return null;
  };

  // Handle view channel
  const handleViewChannel = () => {
    const channelId = getChannelId();
    if (channelId) {
      navigate(`/channel/${channelId}`);
    } else {
      alert("Channel information not available");
    }
  };

  // Handle video error
  const handleVideoError = () => {
    console.log("Video player error, trying fallback...");
    setShowFallbackPlayer(true);
  };

  // Handle share video
  const handleShareVideo = () => {
    const videoUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: video?.title || "YouTube Video",
        text: `Check out this video: ${video?.title}`,
        url: videoUrl,
      });
    } else {
      navigator.clipboard.writeText(videoUrl);
      alert("Video link copied to clipboard!");
    }
  };

  // Handle save video
  const handleSaveVideo = () => {
    if (!user) {
      alert("Please login to save videos");
      navigate("/auth");
      return;
    }
    alert("Video saved to your library!");
  };

  // Handle report video
  const handleReportVideo = () => {
    const reason = prompt("Please enter reason for reporting this video:");
    if (reason) {
      alert("Thank you for reporting. We'll review this video.");
    }
  };

  const safeVideoUrl = video ? getSafeVideoUrl(video.videoUrl) : null;
  const isYouTube = safeVideoUrl && safeVideoUrl.includes("youtube.com/embed");

  if (loading) {
    return (
      <div className="video-player-loading">
        <div className="loading-spinner">
          <FaSpinner className="spinner-icon" />
        </div>
        <p>Loading video...</p>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="video-player-error">
        <div className="error-icon">
          <FaExclamationTriangle size={60} color="#ff9800" />
        </div>
        <h2>{error || "Video not found"}</h2>
        <p>The video you're looking for doesn't exist or cannot be loaded.</p>
        <div className="error-actions">
          <button onClick={() => navigate("/")} className="back-home-btn">
            <FaArrowLeft /> Back to Home
          </button>
          <button
            onClick={() => window.location.reload()}
            className="retry-btn"
          >
            <FaSpinner /> Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      {/* Back Navigation */}
      <div className="video-player-header">
        <button onClick={() => navigate(-1)} className="back-button">
          <FaArrowLeft /> Back
        </button>
        <div className="video-title-mobile">
          <h1>{video.title}</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="video-player-main">
        {/* Left Column - Video Player */}
        <div className="video-player-column">
          {/* Video Player */}
          <div className="video-player-wrapper">
            <div className="video-player">
              {playerError || !safeVideoUrl ? (
                <div className="video-player-error-state">
                  <FaYoutube size={50} color="#FF0000" />
                  <p>
                    Unable to play video. The video may be private or
                    unavailable.
                  </p>
                  <div className="video-url">
                    {video.videoUrl
                      ? `Original URL: ${video.videoUrl.substring(0, 50)}...`
                      : "No video URL available"}
                  </div>
                  <a
                    href={video.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="external-link-btn"
                  >
                    <FaExternalLinkAlt /> Watch on YouTube
                  </a>
                </div>
              ) : (
                <>
                  {showFallbackPlayer || !isYouTube ? (
                    // Fallback HTML5 video player
                    <div className="fallback-player">
                      <div className="player-header">
                        <FaPlay /> Playing: {video.title}
                      </div>
                      <div className="video-notice">
                        <p>
                          Video preview not available. Please visit the original
                          source:
                        </p>
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="external-link-btn"
                        >
                          <FaExternalLinkAlt /> Watch on YouTube
                        </a>
                      </div>
                      {video.thumbnailUrl && (
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="video-thumbnail-large"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/800x450?text=No+Thumbnail";
                          }}
                        />
                      )}
                    </div>
                  ) : (
                    // YouTube embed iframe
                    <div className="youtube-embed-container">
                      <iframe
                        src={safeVideoUrl}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        referrerPolicy="strict-origin-when-cross-origin"
                        onError={handleVideoError}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Video Info */}
          <div className="video-info">
            <h1 className="video-title">{video.title}</h1>

            <div className="video-stats-row">
              <div className="video-stats">
                <span className="views-count">
                  <FaEye /> {formatViews(video.views)}
                </span>
                <span className="upload-date">
                  <FaCalendar /> {formatDate(video.createdAt)}
                </span>
                <span className="video-category">
                  <FaTag /> {video.category}
                </span>
              </div>

              <div className="video-actions-row">
                <LikeDislikeButtons
                  videoId={video._id}
                  initialLikes={video.likes || []}
                  initialDislikes={video.dislikes || []}
                  onUpdate={handleVideoUpdate}
                />
                <button
                  onClick={handleShareVideo}
                  className="action-btn share-btn"
                  title="Share video"
                >
                  <FaShare /> Share
                </button>
                <button
                  onClick={handleSaveVideo}
                  className="action-btn save-btn"
                  title="Save video"
                >
                  <FaBookmark /> Save
                </button>
                <button
                  onClick={handleReportVideo}
                  className="action-btn report-btn"
                  title="Report video"
                >
                  <FaFlag /> Report
                </button>
              </div>
            </div>
          </div>

          {/* Channel Info */}
          <div className="channel-info-section">
            <div className="channel-info-header">
              <div className="channel-avatar-name">
                <div className="channel-avatar">
                  <img
                    src={
                      video.uploader?.avatar ||
                      video.channelId?.owner?.avatar ||
                      video.channelId?.channelAvatar ||
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                    }
                    alt={
                      video.uploader?.username ||
                      video.channelId?.channelName ||
                      "Channel"
                    }
                    onError={(e) => {
                      e.target.src =
                        "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                    }}
                  />
                </div>
                <div className="channel-details">
                  <h3 className="channel-name">
                    {video.channelId?.channelName ||
                      video.uploader?.username ||
                      "Unknown Channel"}
                  </h3>
                  <div className="channel-subscribers">
                    {channel?.subscriberCount
                      ? `${formatViews(channel.subscriberCount)} subscribers`
                      : "Loading subscribers..."}
                  </div>
                </div>
              </div>
              <div className="channel-actions">
                {user && user._id !== video.uploader?._id && (
                  <button
                    onClick={handleSubscribe}
                    className={`subscribe-btn ${
                      isSubscribed ? "subscribed" : ""
                    }`}
                    disabled={subscribing}
                  >
                    {subscribing ? (
                      <FaSpinner className="spinner" />
                    ) : isSubscribed ? (
                      "Subscribed"
                    ) : (
                      "Subscribe"
                    )}
                  </button>
                )}
                <button
                  onClick={handleViewChannel}
                  className="view-channel-btn"
                >
                  View Channel
                </button>
              </div>
            </div>
            {video.channelId?.description && (
              <div className="channel-description">
                <p>{video.channelId.description}</p>
              </div>
            )}
          </div>

          {/* Video Description */}
          <div className="video-description-section">
            <div className="description-header">
              <h3>Description</h3>
              <div className="description-stats">
                <span>{formatViews(video.views)} views</span>
                <span>{formatDate(video.createdAt)}</span>
              </div>
            </div>
            <div className="description-content">
              <p>{video.description || "No description available."}</p>
              {video.tags && video.tags.length > 0 && (
                <div className="video-tags-section">
                  <h4>Tags</h4>
                  <div className="video-tags">
                    {video.tags.map((tag, index) => (
                      <span key={index} className="tag">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Comments */}
        <div className="comments-column">
          <CommentSection
            videoId={video._id}
            initialComments={video.comments || []}
            onUpdate={handleCommentsUpdate}
          />
        </div>
      </div>

      {/* Mobile Comments Section */}
      <div className="mobile-comments-section">
        <CommentSection
          videoId={video._id}
          initialComments={video.comments || []}
          onUpdate={handleCommentsUpdate}
        />
      </div>
    </div>
  );
};

export default VideoPlayer;
