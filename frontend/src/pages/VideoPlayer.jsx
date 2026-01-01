import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { videoAPI } from "../services/api";
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

        setVideo(response.data.video);

        // Check if video URL is valid
        if (!response.data.video.videoUrl) {
          setError("Video URL is missing");
          setPlayerError(true);
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
  }, [id]);

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

  const handleVideoUpdate = (updatedData) => {
    console.log("🔄 Updating video data:", updatedData);
    setVideo((prev) => ({
      ...prev,
      ...updatedData,
    }));
  };

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

  const formatViews = (views) => {
    if (!views) return "0 views";
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

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

    // Try multiple ways to get channel ID
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

  const handleViewChannel = () => {
    const channelId = getChannelId();
    if (channelId) {
      navigate(`/channel/${channelId}`);
    } else {
      alert("Channel information not available");
    }
  };

  const handleVideoError = () => {
    console.log("Video player error, trying fallback...");
    setShowFallbackPlayer(true);
  };

  const safeVideoUrl = video ? getSafeVideoUrl(video.videoUrl) : null;
  const isYouTube = safeVideoUrl && safeVideoUrl.includes("youtube.com/embed");

  if (loading) {
    return (
      <div className="video-player-loading">
        <div className="loading-spinner"></div>
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
        <button onClick={() => navigate("/")} className="back-home-btn">
          <FaArrowLeft /> Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="video-player-container">
      {/* Back Navigation */}
      <button onClick={() => navigate(-1)} className="back-button">
        <FaArrowLeft /> Back
      </button>

      {/* Video Player */}
      <div className="video-player-wrapper">
        <div className="video-player">
          {playerError || !safeVideoUrl ? (
            <div className="video-player-error-state">
              <FaYoutube size={50} color="#FF0000" />
              <p>
                Unable to play video. The video may be private or unavailable.
              </p>
              <div className="video-url">
                {video.videoUrl
                  ? `Original URL: ${video.videoUrl.substring(0, 50)}...`
                  : "No video URL available"}
              </div>
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

        <div className="video-stats">
          <span className="views-count">{formatViews(video.views)}</span>
          <span className="upload-date">{formatDate(video.createdAt)}</span>
          <span className="video-category">{video.category}</span>
        </div>

        {/* Like/Dislike Buttons */}
        <LikeDislikeButtons
          videoId={video._id}
          initialLikes={video.likes || []}
          initialDislikes={video.dislikes || []}
          onUpdate={handleVideoUpdate}
        />

        {/* Channel Info */}
        <div className="channel-info">
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
            {video.channelId?.description && (
              <p className="channel-description">
                {video.channelId.description}
              </p>
            )}
            <button onClick={handleViewChannel} className="view-channel-btn">
              View Channel
            </button>
          </div>
        </div>

        {/* Video Description */}
        <div className="video-description">
          <h3>Description</h3>
          <p>{video.description || "No description available."}</p>
          {video.tags && video.tags.length > 0 && (
            <div className="video-tags">
              {video.tags.map((tag, index) => (
                <span key={index} className="tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Comments Section */}
      <CommentSection
        videoId={video._id}
        initialComments={video.comments || []}
        onUpdate={handleCommentsUpdate}
      />

      {/* Debug Info (Only in development) */}
      {import.meta.env.DEV && (
        <div className="debug-info">
          <details>
            <summary>Debug Information</summary>
            <pre>
              {JSON.stringify(
                {
                  videoId: video._id,
                  hasVideoUrl: !!video.videoUrl,
                  videoUrl: video.videoUrl,
                  safeVideoUrl: safeVideoUrl,
                  isYouTube: isYouTube,
                  showFallbackPlayer: showFallbackPlayer,
                  channelId: getChannelId(),
                  channelInfo: video.channelId,
                  uploader: video.uploader,
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>
      )}
    </div>
  );
};

export default VideoPlayer;
