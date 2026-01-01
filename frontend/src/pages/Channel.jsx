import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { channelAPI, videoAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import VideoCard from "../components/VideoCard";
import {
  FaEdit,
  FaTrash,
  FaPlus,
  FaUpload,
  FaYoutube,
  FaSyncAlt,
  FaUser,
  FaHome,
  FaSubscript,
  FaVideo,
  FaCog,
  FaBell,
  FaShare,
  FaTimes,
  FaCheck,
  FaExternalLinkAlt,
  FaGlobe,
  FaMapMarkerAlt,
  FaSpinner,
  FaEye,
  FaCalendar,
  FaArrowLeft,
} from "react-icons/fa";
import "./Channel.css";

const Channel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    category: "Education",
    tags: "",
  });
  const [formErrors, setFormErrors] = useState({});

  // ✅ Validate MongoDB ObjectId
  const isValidChannelId = (channelId) => {
    if (!channelId) return false;

    // Allow various formats
    if (
      channelId === "undefined" ||
      channelId === "null" ||
      channelId === "unknown"
    ) {
      return false;
    }

    // Check if it's a valid MongoDB ObjectId (24 hex characters)
    const objectIdPattern = /^[0-9a-fA-F]{24}$/;
    if (objectIdPattern.test(channelId)) {
      return true;
    }

    // Also accept string IDs from the database
    return typeof channelId === "string" && channelId.length > 5;
  };

  // ✅ CRITICAL FIX: Check if current user is the channel owner
  const isChannelOwner = useCallback(() => {
    if (!user || !channel) return false;
    if (!user._id) return false;

    const userId = user._id.toString();

    // First check if user owns the channel via the channel.owner field
    if (channel.owner) {
      // If owner is populated object
      if (channel.owner._id) {
        return channel.owner._id.toString() === userId;
      }
      // If owner is direct ID string
      if (typeof channel.owner === "string") {
        return channel.owner === userId;
      }
    }

    // Fallback: check if user's ID matches the channel owner from user data
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUser = JSON.parse(userData);
        if (parsedUser.channels && Array.isArray(parsedUser.channels)) {
          // Check if this channel ID is in user's channels array
          return parsedUser.channels.some(
            (channelId) => channelId.toString() === channel._id.toString()
          );
        }
      }
    } catch (err) {
      console.error("Error checking user channels:", err);
    }

    return false;
  }, [user, channel]);

  // ✅ Validate video form
  const validateVideoForm = () => {
    const errors = {};

    if (!videoForm.title.trim()) {
      errors.title = "Title is required";
    }

    if (!videoForm.videoUrl.trim()) {
      errors.videoUrl = "Video URL is required";
    } else if (
      !videoForm.videoUrl.includes("youtube.com/embed") &&
      !videoForm.videoUrl.includes("youtu.be") &&
      !videoForm.videoUrl.includes("youtube.com/watch")
    ) {
      errors.videoUrl = "Please provide a valid YouTube URL";
    }

    if (!videoForm.thumbnailUrl.trim()) {
      errors.thumbnailUrl = "Thumbnail URL is required";
    } else if (!videoForm.thumbnailUrl.startsWith("http")) {
      errors.thumbnailUrl = "Please provide a valid URL";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // ✅ Fetch channel and videos
  const fetchChannel = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      console.log("📡 Fetching channel with ID:", id);

      // Validate channel ID
      if (!id || id === "undefined" || id === "null") {
        setError("Channel ID is required");
        setLoading(false);
        return;
      }

      // Try different approaches to fetch the channel
      let channelData = null;

      // Approach 1: Try to fetch by direct ID
      try {
        const channelResponse = await channelAPI.getChannel(id);
        if (channelResponse.data && channelResponse.data.success) {
          channelData = channelResponse.data.channel;
        }
      } catch (error1) {
        console.log("Approach 1 failed:", error1.message);

        // Approach 2: If user is logged in, try to get their channel
        if (user) {
          try {
            const myChannelResponse = await channelAPI.getMyChannel();
            if (myChannelResponse.data && myChannelResponse.data.channel) {
              channelData = myChannelResponse.data.channel;

              // Redirect to the correct channel URL
              if (channelData._id !== id) {
                navigate(`/channel/${channelData._id}`, { replace: true });
                return;
              }
            }
          } catch (error2) {
            console.log("Approach 2 failed:", error2.message);
          }
        }
      }

      if (!channelData) {
        setError("Channel not found or you don't have permission to view it");
        setLoading(false);
        return;
      }

      setChannel(channelData);

      // Check subscription status
      if (user && channelData.subscribers) {
        const subscribed = channelData.subscribers.some((sub) => {
          if (sub._id) {
            return sub._id.toString() === user._id?.toString();
          }
          return sub.toString() === user._id?.toString();
        });
        setIsSubscribed(subscribed);
      }

      // Now fetch videos for this channel
      try {
        const videosResponse = await videoAPI.getVideos(
          "",
          "",
          channelData._id
        );
        console.log("🎬 Videos response:", videosResponse.data);

        if (videosResponse.data && videosResponse.data.videos) {
          setVideos(videosResponse.data.videos);
        } else if (Array.isArray(videosResponse.data)) {
          setVideos(videosResponse.data);
        } else {
          setVideos(channelData.videos || []);
        }
      } catch (videoError) {
        console.error("Error fetching videos, using channel data:", videoError);
        setVideos(channelData.videos || []);
      }

      console.log("✅ Channel data loaded successfully:", {
        channelId: channelData._id,
        owner: channelData.owner,
        isCurrentUserOwner: isChannelOwner(),
        currentUserId: user?._id,
        videoCount: videos.length,
      });
    } catch (error) {
      console.error("❌ Error fetching channel:", error);

      // User-friendly error messages
      if (error.message.includes("Invalid channel ID")) {
        setError("The channel ID format is not valid. Please check the URL.");
      } else if (error.message.includes("not found")) {
        setError("This channel doesn't exist or has been removed.");
      } else if (error.message.includes("Network Error")) {
        setError(
          "Unable to connect to the server. Please check your internet connection."
        );
      } else {
        setError(error.message || "Failed to load channel. Please try again.");
      }

      setChannel(null);
      setVideos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user, navigate]);

  // ✅ Handle refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchChannel();
  };

  // ✅ Handle subscribe/unsubscribe
  const handleSubscribe = async () => {
    if (!isAuthenticated()) {
      alert("Please login to subscribe to channels");
      navigate("/auth");
      return;
    }

    if (!channel || !channel._id) {
      alert("Channel not found");
      return;
    }

    try {
      setSubscribing(true);

      if (isSubscribed) {
        await channelAPI.unsubscribe(channel._id);
        setChannel((prev) => ({
          ...prev,
          subscriberCount: Math.max(0, (prev.subscriberCount || 1) - 1),
        }));
        setIsSubscribed(false);
      } else {
        await channelAPI.subscribe(channel._id);
        setChannel((prev) => ({
          ...prev,
          subscriberCount: (prev.subscriberCount || 0) + 1,
        }));
        setIsSubscribed(true);
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      alert(error.message || "Failed to update subscription");
    } finally {
      setSubscribing(false);
    }
  };

  // ✅ Handle create video - FIXED
  const handleCreateVideo = async (e) => {
    e.preventDefault();

    if (!validateVideoForm()) {
      return;
    }

    if (!isAuthenticated()) {
      alert("Please login to upload videos");
      navigate("/auth");
      return;
    }

    if (!channel) {
      alert("Channel not found");
      return;
    }

    // Check if user owns the channel
    if (!isChannelOwner()) {
      alert("You can only upload videos to your own channel");
      return;
    }

    try {
      setLoading(true);

      // Process YouTube URL to ensure it's in embed format
      let processedVideoUrl = videoForm.videoUrl;
      if (processedVideoUrl.includes("youtu.be/")) {
        const videoId = processedVideoUrl.split("youtu.be/")[1].split("?")[0];
        processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (processedVideoUrl.includes("youtube.com/watch")) {
        const videoId = new URL(processedVideoUrl).searchParams.get("v");
        if (videoId) {
          processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }

      const videoData = {
        title: videoForm.title.trim(),
        description: videoForm.description?.trim() || "",
        videoUrl: processedVideoUrl,
        thumbnailUrl: videoForm.thumbnailUrl.trim(),
        channelId: channel._id,
        category: videoForm.category || "Education",
        tags: videoForm.tags
          ? videoForm.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
      };

      console.log("📤 Creating video:", videoData);
      const response = await videoAPI.createVideo(videoData);
      console.log("✅ Video created:", response.data);

      if (response.data && response.data.video) {
        // Update state - add new video at the beginning
        const newVideo = response.data.video;
        setVideos((prev) => [newVideo, ...prev]);

        // Update channel video count
        setChannel((prev) => ({
          ...prev,
          videoCount: (prev.videoCount || 0) + 1,
        }));

        setShowCreateModal(false);
        setFormErrors({});

        // Reset form
        setVideoForm({
          title: "",
          description: "",
          videoUrl: "",
          thumbnailUrl: "",
          category: "Education",
          tags: "",
        });

        alert("🎉 Video uploaded successfully!");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (error) {
      console.error("❌ Error creating video:", error);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to upload video"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle update video - FIXED
  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    if (!selectedVideo) return;

    if (!validateVideoForm()) {
      return;
    }

    // Check if user owns the channel
    if (!isChannelOwner()) {
      alert("You can only edit videos in your own channel");
      return;
    }

    try {
      setLoading(true);

      // Process YouTube URL to ensure it's in embed format
      let processedVideoUrl = videoForm.videoUrl;
      if (processedVideoUrl.includes("youtu.be/")) {
        const videoId = processedVideoUrl.split("youtu.be/")[1].split("?")[0];
        processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
      } else if (processedVideoUrl.includes("youtube.com/watch")) {
        const videoId = new URL(processedVideoUrl).searchParams.get("v");
        if (videoId) {
          processedVideoUrl = `https://www.youtube.com/embed/${videoId}`;
        }
      }

      const videoData = {
        title: videoForm.title.trim(),
        description: videoForm.description?.trim() || "",
        videoUrl: processedVideoUrl,
        thumbnailUrl: videoForm.thumbnailUrl.trim(),
        category: videoForm.category || "Education",
        tags: videoForm.tags
          ? videoForm.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
      };

      console.log("📝 Updating video:", selectedVideo._id, videoData);
      const response = await videoAPI.updateVideo(selectedVideo._id, videoData);
      console.log("✅ Video updated:", response.data);

      // Update the video in the list
      if (response.data && response.data.video) {
        setVideos((prev) =>
          prev.map((video) =>
            video._id === selectedVideo._id ? response.data.video : video
          )
        );
      }

      setShowEditModal(false);
      setSelectedVideo(null);
      setFormErrors({});

      alert("✅ Video updated successfully!");
    } catch (error) {
      console.error("❌ Error updating video:", error);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to update video"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle delete video - FIXED
  const handleDeleteVideo = async (videoId) => {
    // Check if user owns the channel
    if (!isChannelOwner()) {
      alert("You can only delete videos from your own channel");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this video? This action cannot be undone."
      )
    )
      return;

    try {
      setLoading(true);
      console.log("🗑️ Deleting video:", videoId);

      await videoAPI.deleteVideo(videoId);
      console.log("✅ Video deleted successfully");

      // Update state - remove video from list
      setVideos((prev) => prev.filter((v) => v._id !== videoId));

      // Update channel video count
      setChannel((prev) => ({
        ...prev,
        videoCount: Math.max(0, (prev.videoCount || 1) - 1),
      }));

      setShowDeleteModal(false);
      setSelectedVideo(null);

      alert("🗑️ Video deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting video:", error);
      alert(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete video"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Format numbers for display
  const formatNumber = (num) => {
    if (!num && num !== 0) return "0";
    const n = Number(num);
    if (isNaN(n)) return "0";
    if (n >= 1000000000) return `${(n / 1000000000).toFixed(1)}B`;
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return n.toString();
  };

  // ✅ Format date
  const formatDate = (dateString) => {
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

  // ✅ Share channel
  const handleShareChannel = () => {
    const channelUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: channel?.channelName || "Channel",
        text: `Check out this channel: ${channel?.channelName}`,
        url: channelUrl,
      });
    } else {
      navigator.clipboard.writeText(channelUrl);
      alert("Channel link copied to clipboard!");
    }
  };

  // ✅ Edit video button click handler
  const handleEditVideoClick = (video) => {
    setSelectedVideo(video);
    setVideoForm({
      title: video.title || "",
      description: video.description || "",
      videoUrl: video.videoUrl || "",
      thumbnailUrl: video.thumbnailUrl || "",
      category: video.category || "Education",
      tags: video.tags ? video.tags.join(", ") : "",
    });
    setFormErrors({});
    setShowEditModal(true);
  };

  // ✅ Open create video modal
  const openCreateVideoModal = () => {
    setVideoForm({
      title: "",
      description: "",
      videoUrl: "",
      thumbnailUrl: "",
      category: "Education",
      tags: "",
    });
    setFormErrors({});
    setShowCreateModal(true);
  };

  // Effect to fetch channel data
  useEffect(() => {
    if (!id || id === "undefined" || id === "null") {
      setError("Invalid channel ID");
      setLoading(false);
      return;
    }

    fetchChannel();
  }, [id, fetchChannel]);

  // Loading state
  if (loading && !refreshing) {
    return (
      <div className="channel-loading">
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading channel...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !channel) {
    return (
      <div className="channel-error">
        <div className="error-content">
          <FaYoutube size={80} color="#FF0000" />
          <h2>Unable to Load Channel</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate("/")} className="btn btn-primary">
              <FaHome /> Back to Home
            </button>
            {isValidChannelId(id) && (
              <button onClick={handleRefresh} className="btn btn-secondary">
                <FaSyncAlt /> Try Again
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return (
      <div className="channel-error">
        <div className="error-content">
          <FaYoutube size={80} color="#FF0000" />
          <h2>Channel Not Available</h2>
          <p>
            The channel you're looking for doesn't exist or has been removed.
          </p>
          <button onClick={() => navigate("/")} className="btn btn-primary">
            <FaHome /> Back to Home
          </button>
        </div>
      </div>
    );
  }

  const isOwner = isChannelOwner();

  return (
    <div className="channel-page">
      {/* Back button for mobile */}
      <button onClick={() => navigate(-1)} className="channel-back-button">
        <FaArrowLeft /> Back
      </button>

      {/* Channel Header/Banner */}
      <div className="channel-header">
        <div
          className="channel-banner"
          style={{
            backgroundImage: `url(${
              channel.channelBanner || "https://picsum.photos/1200/300"
            })`,
          }}
        >
          <div className="banner-overlay">
            {isOwner && (
              <button
                onClick={() => navigate(`/manage-channel`)}
                className="btn-edit-banner"
              >
                <FaEdit /> Edit Banner
              </button>
            )}
          </div>
        </div>

        <div className="channel-info-container">
          <div className="channel-avatar-container">
            <img
              src={
                channel.owner?.avatar ||
                channel.channelAvatar ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt={channel.channelName}
              className="channel-avatar"
              onError={(e) => {
                e.target.src =
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png";
              }}
            />
            {isOwner && (
              <button
                onClick={() => navigate(`/manage-channel`)}
                className="btn-edit-avatar"
              >
                <FaEdit />
              </button>
            )}
          </div>

          <div className="channel-details">
            <div className="channel-title-section">
              <h1 className="channel-name">
                {channel.channelName || "Unnamed Channel"}
                {channel.verified && (
                  <span className="verified-badge" title="Verified Channel">
                    ✓
                  </span>
                )}
              </h1>
              <div className="channel-owner-info">
                <span className="owner-label">Channel Owner:</span>
                <span className="owner-name">
                  {channel.owner?.username || "Unknown"}
                </span>
                {isOwner && <span className="owner-you-badge">(You)</span>}
              </div>
            </div>

            <div className="channel-meta">
              <span className="meta-item">
                <FaSubscript /> {formatNumber(channel.subscriberCount || 0)}{" "}
                subscribers
              </span>
              <span className="meta-item">
                <FaVideo /> {videos.length || channel.videoCount || 0} videos
              </span>
              {channel.createdAt && (
                <span className="meta-item">
                  <FaCalendar /> Joined {formatDate(channel.createdAt)}
                </span>
              )}
              {channel.location && (
                <span className="meta-item">
                  <FaMapMarkerAlt /> {channel.location}
                </span>
              )}
            </div>

            <p className="channel-description">
              {channel.description || "No description provided."}
            </p>

            {channel.website && (
              <div className="channel-website">
                <FaGlobe />
                <a
                  href={channel.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="website-link"
                >
                  {channel.website.replace(/^https?:\/\//, "")}
                  <FaExternalLinkAlt />
                </a>
              </div>
            )}

            <div className="channel-actions">
              {isOwner ? (
                <>
                  <button
                    onClick={openCreateVideoModal}
                    className="btn btn-primary"
                    disabled={loading}
                  >
                    <FaUpload /> Upload Video
                  </button>
                  <button
                    onClick={() => navigate("/manage-channel")}
                    className="btn btn-secondary"
                  >
                    <FaCog /> Manage Channel
                  </button>
                  <button
                    onClick={handleShareChannel}
                    className="btn btn-outline"
                  >
                    <FaShare /> Share
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="btn btn-outline"
                    disabled={refreshing || loading}
                  >
                    <FaSyncAlt className={refreshing ? "spinning" : ""} />
                    {refreshing ? "Refreshing..." : "Refresh"}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleSubscribe}
                    className={`btn ${
                      isSubscribed ? "btn-subscribed" : "btn-primary"
                    }`}
                    disabled={subscribing || loading}
                  >
                    {subscribing ? (
                      <FaSpinner className="spinning" />
                    ) : isSubscribed ? (
                      <>
                        <FaCheck /> Subscribed
                      </>
                    ) : (
                      <>
                        <FaBell /> Subscribe
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleShareChannel}
                    className="btn btn-outline"
                  >
                    <FaShare /> Share
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Videos Section */}
      <div className="channel-content">
        <div className="section-header">
          <h2>
            <FaVideo /> Videos ({videos.length})
          </h2>

          <div className="section-actions">
            {videos.length > 0 && (
              <select className="sort-select" defaultValue="newest">
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="popular">Most popular</option>
              </select>
            )}
            {isOwner && (
              <button
                onClick={openCreateVideoModal}
                className="btn btn-primary btn-sm"
                disabled={loading}
              >
                <FaPlus /> Upload Video
              </button>
            )}
          </div>
        </div>

        {videos.length === 0 ? (
          <div className="no-videos">
            <div className="no-videos-content">
              <FaVideo size={80} color="#ccc" />
              <h3>No videos yet</h3>
              <p>
                {isOwner
                  ? "Start sharing your content by uploading your first video!"
                  : "This channel hasn't uploaded any videos yet."}
              </p>
              {isOwner && (
                <button
                  onClick={openCreateVideoModal}
                  className="btn btn-primary"
                  disabled={loading}
                >
                  <FaUpload /> Upload Your First Video
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="videos-grid">
            {videos.map((video) => (
              <div key={video._id} className="video-item-wrapper">
                <VideoCard video={video} />

                {isOwner && (
                  <div className="video-actions">
                    <button
                      onClick={() => handleEditVideoClick(video)}
                      className="btn-action btn-edit"
                      title="Edit video"
                      disabled={loading}
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => navigate(`/video/${video._id}`)}
                      className="btn-action btn-analytics"
                      title="View video"
                    >
                      <FaEye /> View
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVideo(video);
                        setShowDeleteModal(true);
                      }}
                      className="btn-action btn-delete"
                      title="Delete video"
                      disabled={loading}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Video Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => !loading && setShowCreateModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload New Video</h2>
              <button
                onClick={() => !loading && setShowCreateModal(false)}
                className="modal-close"
                disabled={loading}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleCreateVideo}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, title: e.target.value })
                  }
                  placeholder="Enter video title"
                  required
                  disabled={loading}
                  className={formErrors.title ? "input-error" : ""}
                />
                {formErrors.title && (
                  <span className="error-text">{formErrors.title}</span>
                )}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, description: e.target.value })
                  }
                  placeholder="Enter video description"
                  rows="3"
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Video URL *</label>
                  <input
                    type="url"
                    value={videoForm.videoUrl}
                    onChange={(e) =>
                      setVideoForm({ ...videoForm, videoUrl: e.target.value })
                    }
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    required
                    disabled={loading}
                    className={formErrors.videoUrl ? "input-error" : ""}
                  />
                  {formErrors.videoUrl ? (
                    <span className="error-text">{formErrors.videoUrl}</span>
                  ) : (
                    <small className="form-help">
                      Use YouTube embed URL
                      (https://www.youtube.com/embed/VIDEO_ID)
                    </small>
                  )}
                </div>

                <div className="form-group">
                  <label>Thumbnail URL *</label>
                  <input
                    type="url"
                    value={videoForm.thumbnailUrl}
                    onChange={(e) =>
                      setVideoForm({
                        ...videoForm,
                        thumbnailUrl: e.target.value,
                      })
                    }
                    placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
                    required
                    disabled={loading}
                    className={formErrors.thumbnailUrl ? "input-error" : ""}
                  />
                  {formErrors.thumbnailUrl ? (
                    <span className="error-text">
                      {formErrors.thumbnailUrl}
                    </span>
                  ) : (
                    <small className="form-help">
                      YouTube thumbnail URL (1280x720 recommended)
                    </small>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={videoForm.category}
                    onChange={(e) =>
                      setVideoForm({ ...videoForm, category: e.target.value })
                    }
                    required
                    disabled={loading}
                  >
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Music">Music</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Sports">Sports</option>
                    <option value="Technology">Technology</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="News">News</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={videoForm.tags}
                    onChange={(e) =>
                      setVideoForm({ ...videoForm, tags: e.target.value })
                    }
                    placeholder="react, tutorial, javascript"
                    disabled={loading}
                  />
                  <small className="form-help">
                    Add relevant tags to help viewers find your video
                  </small>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => !loading && setShowCreateModal(false)}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="spinning" /> Uploading...
                    </>
                  ) : (
                    "Upload Video"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditModal && selectedVideo && (
        <div
          className="modal-overlay"
          onClick={() => !loading && setShowEditModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Video</h2>
              <button
                onClick={() => !loading && setShowEditModal(false)}
                className="modal-close"
                disabled={loading}
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdateVideo}>
              <div className="form-group">
                <label>Title *</label>
                <input
                  type="text"
                  value={videoForm.title}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, title: e.target.value })
                  }
                  placeholder="Enter video title"
                  required
                  disabled={loading}
                  className={formErrors.title ? "input-error" : ""}
                />
                {formErrors.title && (
                  <span className="error-text">{formErrors.title}</span>
                )}
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, description: e.target.value })
                  }
                  placeholder="Enter video description"
                  rows="3"
                  disabled={loading}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Video URL *</label>
                  <input
                    type="url"
                    value={videoForm.videoUrl}
                    onChange={(e) =>
                      setVideoForm({ ...videoForm, videoUrl: e.target.value })
                    }
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                    required
                    disabled={loading}
                    className={formErrors.videoUrl ? "input-error" : ""}
                  />
                  {formErrors.videoUrl && (
                    <span className="error-text">{formErrors.videoUrl}</span>
                  )}
                </div>

                <div className="form-group">
                  <label>Thumbnail URL *</label>
                  <input
                    type="url"
                    value={videoForm.thumbnailUrl}
                    onChange={(e) =>
                      setVideoForm({
                        ...videoForm,
                        thumbnailUrl: e.target.value,
                      })
                    }
                    placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
                    required
                    disabled={loading}
                    className={formErrors.thumbnailUrl ? "input-error" : ""}
                  />
                  {formErrors.thumbnailUrl && (
                    <span className="error-text">
                      {formErrors.thumbnailUrl}
                    </span>
                  )}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={videoForm.category}
                    onChange={(e) =>
                      setVideoForm({ ...videoForm, category: e.target.value })
                    }
                    required
                    disabled={loading}
                  >
                    <option value="Education">Education</option>
                    <option value="Entertainment">Entertainment</option>
                    <option value="Music">Music</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Sports">Sports</option>
                    <option value="Technology">Technology</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="News">News</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Tags (comma separated)</label>
                  <input
                    type="text"
                    value={videoForm.tags}
                    onChange={(e) =>
                      setVideoForm({ ...videoForm, tags: e.target.value })
                    }
                    placeholder="react, tutorial, javascript"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => !loading && setShowEditModal(false)}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <FaSpinner className="spinning" /> Updating...
                    </>
                  ) : (
                    "Update Video"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVideo && (
        <div
          className="modal-overlay"
          onClick={() => !loading && setShowDeleteModal(false)}
        >
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Video</h2>
              <button
                onClick={() => !loading && setShowDeleteModal(false)}
                className="modal-close"
                disabled={loading}
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="delete-warning">
                <FaTrash size={40} color="#ff4444" />
                <p>Are you sure you want to delete this video?</p>
                <p className="video-title">{selectedVideo.title}</p>
                <div className="video-stats">
                  <span>
                    <FaEye /> {formatNumber(selectedVideo.views || 0)} views
                  </span>
                  <span>
                    <FaCalendar /> {formatDate(selectedVideo.createdAt)}
                  </span>
                </div>
                <p className="text-danger">⚠️ This action cannot be undone.</p>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => !loading && setShowDeleteModal(false)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteVideo(selectedVideo._id)}
                className="btn btn-danger"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinning" /> Deleting...
                  </>
                ) : (
                  "Delete Video"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channel;
