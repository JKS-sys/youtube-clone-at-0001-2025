import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import ReactPlayer from "react-player";
import { videoAPI } from "../services/api";
import LikeDislikeButtons from "../components/LikeDislikeButtons";
import CommentSection from "../components/CommentSection";
import { FaArrowLeft, FaUserCircle, FaYoutube } from "react-icons/fa";
import "./VideoPlayer.css";

const VideoPlayer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [playerError, setPlayerError] = useState(false);

  useEffect(() => {
    const fetchVideo = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await videoAPI.getVideo(id);
        setVideo(response.data);
      } catch (err) {
        console.error("Error fetching video:", err);
        setError("Failed to load video. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchVideo();
  }, [id]);

  const handleVideoUpdate = (updatedData) => {
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
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M views`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K views`;
    }
    return `${views} views`;
  };

  const formatDate = (dateString) => {
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
              <p>Unable to play video. The video URL may be invalid.</p>
              <p className="video-url">URL: {video.videoUrl}</p>
            </div>
          ) : (
            <ReactPlayer
              url={video.videoUrl}
              controls
              width="100%"
              height="100%"
              onError={() => setPlayerError(true)}
              style={{ backgroundColor: "#000" }}
              config={{
                file: {
                  attributes: {
                    controlsList: "nodownload",
                  },
                },
              }}
            />
          )}
        </div>
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
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt={video.uploader?.username}
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
              onClick={() => navigate(`/channel/${video.channelId?._id}`)}
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
