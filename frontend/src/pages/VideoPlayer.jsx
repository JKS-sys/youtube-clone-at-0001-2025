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
} from "react-icons/fa";
import "./VideoPlayer.css";

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playerError, setPlayerError] = useState(false);
  const [useIframe, setUseIframe] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError("");
        console.log("📡 Fetching video:", id);

        const response = await videoAPI.getVideo(id);
        console.log("📦 Video data:", response.data);

        if (!response.data) {
          throw new Error("Video not found");
        }

        setVideo(response.data);

        // Check if video URL is valid
        if (!response.data.videoUrl) {
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

    if (id) {
      fetchVideo();
    }
  }, [id]);

  // Get video embed URL
  const getVideoEmbedUrl = (videoUrl) => {
    if (!videoUrl) return "";

    // YouTube URL conversion
    if (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) {
      let videoId = "";

      // Extract video ID from various formats
      if (videoUrl.includes("youtube.com/watch?v=")) {
        videoId = videoUrl.split("v=")[1]?.split("&")[0];
      } else if (videoUrl.includes("youtu.be/")) {
        videoId = videoUrl.split("youtu.be/")[1]?.split("?")[0];
      } else if (videoUrl.includes("youtube.com/embed/")) {
        videoId = videoUrl.split("embed/")[1]?.split("?")[0];
      }

      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`;
      }
    }

    // For direct video files
    if (
      videoUrl.includes(".mp4") ||
      videoUrl.includes(".webm") ||
      videoUrl.includes(".ogg")
    ) {
      return videoUrl;
    }

    return videoUrl;
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
        comments: response.data.comments,
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
          <FaYoutube size={50} color="#ff0000" />
        </div>
        <h2>{error || "Video not found"}</h2>
        <p>The video you're looking for doesn't exist or cannot be loaded.</p>
        <button onClick={() => navigate("/")} className="back-home-btn">
          <FaArrowLeft /> Back to Home
        </button>
      </div>
    );
  }

  const videoEmbedUrl = getVideoEmbedUrl(video.videoUrl);
  const isYouTube = videoEmbedUrl.includes("youtube.com/embed");

  return (
    <div className="video-player-container">
      {/* Back Navigation */}
      <button onClick={() => navigate(-1)} className="back-button">
        <FaArrowLeft /> Back
      </button>

      {/* Video Player */}
      <div className="video-player-wrapper">
        <div className="video-player">
          {playerError ? (
            <div className="video-player-error-state">
              <FaYoutube size={50} color="#ff0000" />
              <p>Unable to play video. Trying fallback player...</p>
              <button
                onClick={() => setUseIframe(true)}
                style={{
                  padding: "10px 20px",
                  background: "#065fd4",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer",
                  marginTop: "10px",
                }}
              >
                Use Simple Player
              </button>
            </div>
          ) : (
            <>
              {useIframe ? (
                // Simple iframe player as fallback
                <iframe
                  src={videoEmbedUrl}
                  title={video.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#000",
                  }}
                  onError={() => setPlayerError(true)}
                />
              ) : (
                // Try to use HTML5 video player first
                <video
                  controls
                  style={{
                    width: "100%",
                    height: "100%",
                    backgroundColor: "#000",
                  }}
                  onError={() => {
                    console.log("❌ HTML5 video failed, trying iframe...");
                    setUseIframe(true);
                  }}
                >
                  {videoEmbedUrl && (
                    <source src={videoEmbedUrl} type="video/mp4" />
                  )}
                  Your browser does not support the video tag.
                </video>
              )}
            </>
          )}
        </div>
      </div>

      {/* Debug Info - Remove in production */}
      <div
        style={{
          padding: "10px",
          margin: "10px 0",
          background: "#f0f0f0",
          borderRadius: "5px",
          fontSize: "12px",
          fontFamily: "monospace",
        }}
      >
        <strong>Video Debug:</strong> ID: {video._id} | URL:{" "}
        {video.videoUrl ? video.videoUrl.substring(0, 50) + "..." : "Missing"} |
        Embed URL: {videoEmbedUrl ? "Yes" : "No"} | Is YouTube:{" "}
        {isYouTube ? "Yes" : "No"}
      </div>

      {/* Video Info */}
      <div className="video-info">
        <h1 className="video-title">{video.title}</h1>

        <div className="video-stats">
          <span className="views-count">{formatViews(video.views)}</span>
          <span className="upload-date">{formatDate(video.createdAt)}</span>
        </div>

        {/* Like/Dislike Buttons */}
        <LikeDislikeButtons
          videoId={video._id}
          initialLikes={video.likes}
          initialDislikes={video.dislikes}
          onUpdate={handleVideoUpdate}
        />

        {/* Channel Info */}
        <div className="channel-info">
          <div className="channel-avatar">
            <img
              src={
                video.uploader?.avatar ||
                video.channelId?.owner?.avatar ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt={video.uploader?.username || video.channelId?.channelName}
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
            <button
              onClick={() => {
                if (video.channelId) {
                  navigate(
                    `/channel/${video.channelId._id || video.channelId}`
                  );
                } else {
                  alert("Channel information not available");
                }
              }}
              className="view-channel-btn"
            >
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
    </div>
  );
};

export default VideoPlayer;
