import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
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
  FaEllipsisV,
  FaThumbsUp,
  FaCalendar,
  FaEye,
  FaComment,
  FaTimes,
  FaCheck,
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

  // Check if current user is the channel owner
  const isChannelOwner = useCallback(() => {
    if (!user || !channel) return false;

    // Get user ID
    const userId = user._id?.toString();
    if (!userId) return false;

    // Check if user owns the channel
    if (channel.owner && channel.owner._id) {
      return channel.owner._id.toString() === userId;
    }

    // If owner is a string (not populated)
    if (typeof channel.owner === "string") {
      return channel.owner.toString() === userId;
    }

    return false;
  }, [user, channel]);

  const fetchChannel = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      console.log("📡 Fetching channel:", id);

      const response = await channelAPI.getChannel(id);

      if (!response.data) {
        throw new Error("Channel not found");
      }

      setChannel(response.data);

      // Check subscription status
      if (user && response.data.subscribers) {
        const subscribed = response.data.subscribers.some(
          (sub) =>
            sub._id?.toString() === user._id?.toString() ||
            sub.toString() === user._id?.toString()
        );
        setIsSubscribed(subscribed);
      }

      // Fetch videos for this channel
      try {
        const videosResponse = await videoAPI.getVideos();
        const channelVideos = videosResponse.data.filter(
          (video) =>
            video.channelId &&
            (video.channelId._id === id || video.channelId === id)
        );
        setVideos(channelVideos);
      } catch (videoError) {
        console.error("Error fetching videos:", videoError);
        setVideos([]);
      }
    } catch (error) {
      console.error("❌ Error fetching channel:", error);
      setError(
        error.response?.data?.message ||
          error.message ||
          "Failed to load channel"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id, user]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchChannel();
  };

  useEffect(() => {
    if (id) {
      fetchChannel();
    }
  }, [id, fetchChannel]);

  const handleCreateVideo = async (e) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      alert("Please login to upload videos");
      navigate("/auth");
      return;
    }

    if (!channel) {
      alert("Channel not found");
      return;
    }

    // Validation
    if (!videoForm.title.trim()) {
      alert("Video title is required");
      return;
    }

    if (!videoForm.videoUrl.trim()) {
      alert("Video URL is required");
      return;
    }

    if (!videoForm.thumbnailUrl.trim()) {
      alert("Thumbnail URL is required");
      return;
    }

    try {
      setLoading(true);

      const videoData = {
        ...videoForm,
        channelId: channel._id,
        uploader: user._id,
        tags: videoForm.tags
          ? videoForm.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
      };

      const response = await videoAPI.createVideo(videoData);

      // Add the new video to the list
      setVideos((prev) => [response.data, ...prev]);
      setShowCreateModal(false);

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

      // Refresh channel data
      fetchChannel();
    } catch (error) {
      console.error("❌ Error creating video:", error);
      alert(error.response?.data?.message || "Failed to upload video");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    if (!selectedVideo) return;

    try {
      setLoading(true);

      const videoData = {
        ...videoForm,
        tags: videoForm.tags
          ? videoForm.tags
              .split(",")
              .map((tag) => tag.trim())
              .filter((tag) => tag)
          : [],
      };

      const response = await videoAPI.updateVideo(selectedVideo._id, videoData);

      // Update the video in the list
      setVideos((prev) =>
        prev.map((video) =>
          video._id === selectedVideo._id ? response.data : video
        )
      );

      setShowEditModal(false);
      setSelectedVideo(null);

      alert("✅ Video updated successfully!");
    } catch (error) {
      console.error("❌ Error updating video:", error);
      alert(error.response?.data?.message || "Failed to update video");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      setLoading(true);
      await videoAPI.deleteVideo(videoId);

      // Remove the video from the list
      setVideos((prev) => prev.filter((v) => v._id !== videoId));

      setShowDeleteModal(false);
      alert("🗑️ Video deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting video:", error);
      alert(error.response?.data?.message || "Failed to delete video");
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!isAuthenticated()) {
      alert("Please login to subscribe");
      navigate("/auth");
      return;
    }

    try {
      // TODO: Implement subscription API
      setIsSubscribed(!isSubscribed);
      alert(isSubscribed ? "Unsubscribed" : "Subscribed");
    } catch (error) {
      console.error("Error subscribing:", error);
    }
  };

  const formatNumber = (num) => {
    if (!num) return "0";
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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
          <FaYoutube size={60} color="#FF0000" />
          <h2>Channel Not Found</h2>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={() => navigate("/")} className="btn btn-primary">
              <FaHome /> Back to Home
            </button>
            <button onClick={handleRefresh} className="btn btn-secondary">
              <FaSyncAlt /> Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!channel) {
    return null;
  }

  const isOwner = isChannelOwner();

  return (
    <div className="channel-page">
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
          <div className="banner-overlay"></div>
        </div>

        <div className="channel-info-container">
          <div className="channel-avatar-container">
            <img
              src={
                channel.owner?.avatar ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt={channel.channelName}
              className="channel-avatar"
              onError={(e) => {
                e.target.src =
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png";
              }}
            />
          </div>

          <div className="channel-details">
            <h1 className="channel-name">{channel.channelName}</h1>

            <div className="channel-meta">
              <span className="meta-item">
                <FaUser /> {channel.owner?.username || "Unknown"}
              </span>
              <span className="meta-item">
                <FaSubscript /> {formatNumber(channel.subscriberCount || 0)}{" "}
                subscribers
              </span>
              <span className="meta-item">
                <FaVideo /> {channel.videoCount || 0} videos
              </span>
              {channel.createdAt && (
                <span className="meta-item">
                  <FaCalendar /> Joined {formatDate(channel.createdAt)}
                </span>
              )}
            </div>

            <p className="channel-description">
              {channel.description || "No description provided."}
            </p>

            <div className="channel-actions">
              {isOwner ? (
                <>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="btn btn-primary"
                  >
                    <FaUpload /> Upload Video
                  </button>
                  <button
                    onClick={() => navigate(`/channel/edit/${channel._id}`)}
                    className="btn btn-secondary"
                  >
                    <FaCog /> Manage Channel
                  </button>
                  <button
                    onClick={handleRefresh}
                    className="btn btn-outline"
                    disabled={refreshing}
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
                  >
                    {isSubscribed ? (
                      <>
                        <FaCheck /> Subscribed
                      </>
                    ) : (
                      <>
                        <FaBell /> Subscribe
                      </>
                    )}
                  </button>
                  <button className="btn btn-outline">
                    <FaShare /> Share
                  </button>
                  <button className="btn btn-icon">
                    <FaEllipsisV />
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

          {isOwner && videos.length > 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary btn-sm"
            >
              <FaPlus /> Upload Video
            </button>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="no-videos">
            <div className="no-videos-content">
              <FaVideo size={60} color="#ccc" />
              <h3>No videos yet</h3>
              <p>
                {isOwner
                  ? "Start sharing your content by uploading your first video!"
                  : "This channel hasn't uploaded any videos yet."}
              </p>
              {isOwner && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
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
                      onClick={() => {
                        setSelectedVideo(video);
                        setVideoForm({
                          title: video.title || "",
                          description: video.description || "",
                          videoUrl: video.videoUrl || "",
                          thumbnailUrl: video.thumbnailUrl || "",
                          category: video.category || "Education",
                          tags: video.tags ? video.tags.join(", ") : "",
                        });
                        setShowEditModal(true);
                      }}
                      className="btn-action btn-edit"
                      title="Edit video"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => {
                        setSelectedVideo(video);
                        setShowDeleteModal(true);
                      }}
                      className="btn-action btn-delete"
                      title="Delete video"
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

      {/* About Section */}
      {channel.description && (
        <div className="about-section">
          <h3>About</h3>
          <div className="about-content">
            <p>{channel.description}</p>
            <div className="channel-stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Videos</span>
                <span className="stat-value">
                  <FaVideo /> {channel.videoCount || 0}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Subscribers</span>
                <span className="stat-value">
                  <FaSubscript /> {formatNumber(channel.subscriberCount || 0)}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Views</span>
                <span className="stat-value">
                  <FaEye /> {formatNumber(channel.totalViews || 0)}
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Channel Created</span>
                <span className="stat-value">
                  <FaCalendar /> {formatDate(channel.createdAt)}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Video Modal */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload New Video</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="modal-close"
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
                />
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
                    placeholder="https://example.com/video.mp4"
                    required
                    disabled={loading}
                  />
                  <small>Direct video link or YouTube URL</small>
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
                    placeholder="https://example.com/thumbnail.jpg"
                    required
                    disabled={loading}
                  />
                  <small>Image URL for thumbnail</small>
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
                  onClick={() => setShowCreateModal(false)}
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
                  {loading ? "Uploading..." : "Upload Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditModal && selectedVideo && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Video</h2>
              <button
                onClick={() => setShowEditModal(false)}
                className="modal-close"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdateVideo}>
              {/* Same form structure as create modal */}
              {/* ... */}
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedVideo && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteModal(false)}
        >
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Video</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="modal-close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <p>Are you sure you want to delete this video?</p>
              <p className="text-muted">{selectedVideo.title}</p>
              <p className="text-warning">This action cannot be undone.</p>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
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
                {loading ? "Deleting..." : "Delete Video"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channel;
