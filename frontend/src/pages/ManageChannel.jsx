import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { channelAPI, videoAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  FaEdit,
  FaTrash,
  FaSave,
  FaTimes,
  FaUpload,
  FaVideo,
  FaCog,
  FaUsers,
  FaEye,
  FaCalendar,
  FaYoutube,
  FaArrowLeft,
  FaPlay,
  FaCheck,
  FaTimesCircle,
  FaSpinner,
  FaPlus,
  FaExternalLinkAlt,
  FaLink,
  FaGlobe,
  FaMapMarkerAlt,
  FaEyeSlash,
  FaCheckCircle,
} from "react-icons/fa";
import "./ManageChannel.css";

const ManageChannel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showChannelEditModal, setShowChannelEditModal] = useState(false);
  const [showCreateVideoModal, setShowCreateVideoModal] = useState(false);
  const [showEditVideoModal, setShowEditVideoModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeleteChannelConfirm, setShowDeleteChannelConfirm] =
    useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  const [channelForm, setChannelForm] = useState({
    channelName: "",
    description: "",
    channelBanner: "",
    website: "",
    location: "",
    socialLinks: {
      twitter: "",
      facebook: "",
      instagram: "",
      linkedin: "",
    },
  });

  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    category: "Education",
    tags: "",
    isPublished: true,
  });

  const [formErrors, setFormErrors] = useState({});

  // Load channel data
  useEffect(() => {
    const loadChannelData = async () => {
      if (!user) {
        navigate("/auth");
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await channelAPI.getMyChannel();
        if (response.data.channel) {
          const channelData = response.data.channel;
          setChannel(channelData);
          setVideos(response.data.videos || []);

          // Initialize channel form
          setChannelForm({
            channelName: channelData.channelName || "",
            description: channelData.description || "",
            channelBanner: channelData.channelBanner || "",
            website: channelData.website || "",
            location: channelData.location || "",
            socialLinks: {
              twitter: channelData.socialLinks?.twitter || "",
              facebook: channelData.socialLinks?.facebook || "",
              instagram: channelData.socialLinks?.instagram || "",
              linkedin: channelData.socialLinks?.linkedin || "",
            },
          });
        } else {
          setChannel(null);
        }
      } catch (err) {
        console.error("Error loading channel data:", err);
        if (err.response?.status === 404) {
          setChannel(null);
        } else {
          setError(
            err.response?.data?.message || "Failed to load channel data"
          );
        }
      } finally {
        setLoading(false);
      }
    };

    loadChannelData();
  }, [user, navigate]);

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

  // ✅ Update channel settings
  const handleUpdateChannel = async (e) => {
    e.preventDefault();
    if (!channel) return;

    try {
      setLoading(true);
      const response = await channelAPI.updateChannel(channel._id, channelForm);

      setChannel(response.data.channel);
      setShowChannelEditModal(false);
      setSuccess("✅ Channel settings updated!");

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating channel:", err);
      setError(err.response?.data?.message || "Failed to update channel");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Create new video
  const handleCreateVideo = async (e) => {
    e.preventDefault();

    if (!validateVideoForm()) {
      return;
    }

    if (!channel) {
      setError("Channel not found");
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
        isPublished: videoForm.isPublished,
      };

      const response = await videoAPI.createVideo(videoData);

      if (response.data && response.data.video) {
        // Add new video to the list
        const newVideo = response.data.video;
        setVideos((prev) => [newVideo, ...prev]);

        setShowCreateVideoModal(false);
        setVideoForm({
          title: "",
          description: "",
          videoUrl: "",
          thumbnailUrl: "",
          category: "Education",
          tags: "",
          isPublished: true,
        });
        setFormErrors({});
        setSuccess("✅ Video uploaded successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error creating video:", err);
      setError(err.response?.data?.message || "Failed to upload video");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Update video
  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    if (!selectedVideo) return;

    if (!validateVideoForm()) {
      return;
    }

    try {
      setLoading(true);

      // Process YouTube URL
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
        isPublished: videoForm.isPublished,
      };

      const response = await videoAPI.updateVideo(selectedVideo._id, videoData);

      if (response.data && response.data.video) {
        // Update video in the list
        setVideos((prev) =>
          prev.map((video) =>
            video._id === selectedVideo._id ? response.data.video : video
          )
        );

        setShowEditVideoModal(false);
        setSelectedVideo(null);
        setVideoForm({
          title: "",
          description: "",
          videoUrl: "",
          thumbnailUrl: "",
          category: "Education",
          tags: "",
          isPublished: true,
        });
        setFormErrors({});
        setSuccess("✅ Video updated successfully!");
        setTimeout(() => setSuccess(""), 3000);
      }
    } catch (err) {
      console.error("Error updating video:", err);
      setError(err.response?.data?.message || "Failed to update video");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete video
  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      setLoading(true);
      await videoAPI.deleteVideo(videoId);

      // Remove video from list
      setVideos((prev) => prev.filter((v) => v._id !== videoId));

      setShowDeleteConfirm(false);
      setSelectedVideo(null);
      setSuccess("🗑️ Video deleted successfully!");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error deleting video:", err);
      setError(err.response?.data?.message || "Failed to delete video");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Delete channel
  const handleDeleteChannel = async () => {
    if (!channel) return;

    if (
      !window.confirm(
        "Are you sure? This will delete ALL videos in this channel and cannot be undone!"
      )
    ) {
      return;
    }

    try {
      setLoading(true);
      await channelAPI.deleteChannel(channel._id);

      setSuccess("🗑️ Channel deleted successfully!");
      setTimeout(() => {
        navigate("/");
      }, 2000);
    } catch (err) {
      console.error("Error deleting channel:", err);
      setError(err.response?.data?.message || "Failed to delete channel");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Open edit video modal
  const handleEditVideoClick = (video) => {
    setSelectedVideo(video);
    setVideoForm({
      title: video.title || "",
      description: video.description || "",
      videoUrl: video.videoUrl || "",
      thumbnailUrl: video.thumbnailUrl || "",
      category: video.category || "Education",
      tags: video.tags ? video.tags.join(", ") : "",
      isPublished: video.isPublished !== false,
    });
    setFormErrors({});
    setShowEditVideoModal(true);
  };

  // ✅ Toggle video publish status
  const handleTogglePublish = async (video) => {
    try {
      setLoading(true);
      const updatedVideo = await videoAPI.updateVideo(video._id, {
        ...video,
        isPublished: !video.isPublished,
      });

      // Update video in the list
      setVideos((prev) =>
        prev.map((v) => (v._id === video._id ? updatedVideo.data.video : v))
      );

      setSuccess(
        updatedVideo.data.video.isPublished
          ? "✅ Video published!"
          : "✅ Video unpublished!"
      );
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error toggling publish status:", err);
      setError(err.response?.data?.message || "Failed to update video status");
    } finally {
      setLoading(false);
    }
  };

  // Format helpers
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatViews = (views) => {
    if (!views) return "0";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K`;
    return views.toString();
  };

  // Loading state
  if (loading && !channel) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading channel data...</p>
      </div>
    );
  }

  // No channel state
  if (!channel) {
    return (
      <div className="no-channel-container">
        <div className="no-channel-card">
          <FaYoutube size={80} color="#FF0000" />
          <h2>You don't have a channel yet</h2>
          <p>Create a channel to start uploading and managing videos</p>
          <div className="action-buttons">
            <button
              onClick={() => navigate("/create-channel")}
              className="btn btn-primary"
            >
              Create Channel
            </button>
            <button onClick={() => navigate("/")} className="btn btn-secondary">
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="manage-channel-page">
      {/* Header */}
      <div className="page-header">
        <button onClick={() => navigate(-1)} className="back-btn">
          <FaArrowLeft /> Back
        </button>
        <div className="header-content">
          <h1>Manage Channel</h1>
          <p className="channel-subtitle">
            {channel.channelName} • {videos.length} videos
          </p>
        </div>
      </div>

      {/* Messages */}
      {success && (
        <div className="alert alert-success">
          <FaCheck /> {success}
        </div>
      )}
      {error && (
        <div className="alert alert-error">
          <FaTimesCircle /> {error}
        </div>
      )}

      {/* Channel Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <FaVideo />
          </div>
          <div className="stat-content">
            <h3>{videos.length}</h3>
            <p>Total Videos</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaUsers />
          </div>
          <div className="stat-content">
            <h3>{formatViews(channel.subscriberCount || 0)}</h3>
            <p>Subscribers</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaEye />
          </div>
          <div className="stat-content">
            <h3>{formatViews(channel.totalViews || 0)}</h3>
            <p>Total Views</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <FaCalendar />
          </div>
          <div className="stat-content">
            <h3>{formatDate(channel.createdAt)}</h3>
            <p>Created</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          onClick={() => setShowChannelEditModal(true)}
          className="btn btn-primary"
        >
          <FaCog /> Edit Channel
        </button>
        <button
          onClick={() => navigate(`/channel/${channel._id}`)}
          className="btn btn-secondary"
        >
          <FaYoutube /> View Channel
        </button>
        <button
          onClick={() => setShowCreateVideoModal(true)}
          className="btn btn-success"
        >
          <FaUpload /> Upload Video
        </button>
        <button
          onClick={() => setShowDeleteChannelConfirm(true)}
          className="btn btn-danger"
        >
          <FaTrash /> Delete Channel
        </button>
      </div>

      {/* Videos Section */}
      <div className="videos-section">
        <div className="section-header">
          <h2>Your Videos ({videos.length})</h2>
          <button
            onClick={() => setShowCreateVideoModal(true)}
            className="btn btn-sm btn-primary"
          >
            <FaPlus /> Add Video
          </button>
        </div>

        {videos.length === 0 ? (
          <div className="empty-state">
            <FaVideo size={60} color="#ccc" />
            <h3>No videos yet</h3>
            <p>Upload your first video to get started!</p>
            <button
              onClick={() => setShowCreateVideoModal(true)}
              className="btn btn-primary"
            >
              <FaUpload /> Upload First Video
            </button>
          </div>
        ) : (
          <div className="videos-table-container">
            <table className="videos-table">
              <thead>
                <tr>
                  <th>Video</th>
                  <th>Details</th>
                  <th>Status</th>
                  <th>Views</th>
                  <th>Uploaded</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((video) => (
                  <tr key={video._id}>
                    <td className="video-cell">
                      <div className="video-thumbnail-wrapper">
                        <img
                          src={video.thumbnailUrl}
                          alt={video.title}
                          className="video-thumbnail"
                          onError={(e) => {
                            e.target.src =
                              "https://via.placeholder.com/120x68?text=Thumbnail";
                          }}
                        />
                      </div>
                    </td>
                    <td className="details-cell">
                      <div className="video-details">
                        <h4 className="video-title">{video.title}</h4>
                        <p className="video-description">
                          {video.description?.substring(0, 60) ||
                            "No description"}
                          ...
                        </p>
                        <div className="video-tags">
                          {video.tags?.slice(0, 3).map((tag, index) => (
                            <span key={index} className="tag">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </td>
                    <td className="status-cell">
                      <span
                        className={`status-badge ${
                          video.isPublished !== false
                            ? "status-published"
                            : "status-unpublished"
                        }`}
                      >
                        {video.isPublished !== false ? (
                          <>
                            <FaCheckCircle /> Published
                          </>
                        ) : (
                          <>
                            <FaEyeSlash /> Unpublished
                          </>
                        )}
                      </span>
                    </td>
                    <td className="views-cell">
                      <span className="views-count">
                        {formatViews(video.views)}
                      </span>
                    </td>
                    <td className="date-cell">{formatDate(video.createdAt)}</td>
                    <td className="actions-cell">
                      <div className="table-actions">
                        <button
                          onClick={() => navigate(`/video/${video._id}`)}
                          className="btn-action btn-view"
                          title="View video"
                        >
                          <FaPlay />
                        </button>
                        <button
                          onClick={() => handleEditVideoClick(video)}
                          className="btn-action btn-edit"
                          title="Edit video"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleTogglePublish(video)}
                          className="btn-action btn-toggle"
                          title={
                            video.isPublished !== false
                              ? "Unpublish video"
                              : "Publish video"
                          }
                        >
                          {video.isPublished !== false ? (
                            <FaEyeSlash />
                          ) : (
                            <FaCheckCircle />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteVideo(video._id)}
                          className="btn-action btn-delete"
                          title="Delete video"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Channel Modal */}
      {showChannelEditModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowChannelEditModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Channel Settings</h2>
              <button
                onClick={() => setShowChannelEditModal(false)}
                className="modal-close"
              >
                <FaTimes />
              </button>
            </div>

            <form onSubmit={handleUpdateChannel}>
              <div className="form-group">
                <label>Channel Name *</label>
                <input
                  type="text"
                  value={channelForm.channelName}
                  onChange={(e) =>
                    setChannelForm({
                      ...channelForm,
                      channelName: e.target.value,
                    })
                  }
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={channelForm.description}
                  onChange={(e) =>
                    setChannelForm({
                      ...channelForm,
                      description: e.target.value,
                    })
                  }
                  rows="3"
                  disabled={loading}
                  placeholder="Describe your channel..."
                />
              </div>

              <div className="form-group">
                <label>Banner Image URL</label>
                <input
                  type="url"
                  value={channelForm.channelBanner}
                  onChange={(e) =>
                    setChannelForm({
                      ...channelForm,
                      channelBanner: e.target.value,
                    })
                  }
                  disabled={loading}
                  placeholder="https://example.com/banner.jpg"
                />
                <small className="help-text">
                  Recommended size: 1200x300 pixels
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Website</label>
                  <input
                    type="url"
                    value={channelForm.website}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        website: e.target.value,
                      })
                    }
                    disabled={loading}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="form-group">
                  <label>Location</label>
                  <input
                    type="text"
                    value={channelForm.location}
                    onChange={(e) =>
                      setChannelForm({
                        ...channelForm,
                        location: e.target.value,
                      })
                    }
                    disabled={loading}
                    placeholder="City, Country"
                  />
                </div>
              </div>

              <div className="social-links-section">
                <h4>Social Links</h4>
                <div className="form-row">
                  <div className="form-group">
                    <label>Twitter</label>
                    <input
                      type="url"
                      value={channelForm.socialLinks.twitter}
                      onChange={(e) =>
                        setChannelForm({
                          ...channelForm,
                          socialLinks: {
                            ...channelForm.socialLinks,
                            twitter: e.target.value,
                          },
                        })
                      }
                      disabled={loading}
                      placeholder="https://twitter.com/username"
                    />
                  </div>
                  <div className="form-group">
                    <label>Facebook</label>
                    <input
                      type="url"
                      value={channelForm.socialLinks.facebook}
                      onChange={(e) =>
                        setChannelForm({
                          ...channelForm,
                          socialLinks: {
                            ...channelForm.socialLinks,
                            facebook: e.target.value,
                          },
                        })
                      }
                      disabled={loading}
                      placeholder="https://facebook.com/username"
                    />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Instagram</label>
                    <input
                      type="url"
                      value={channelForm.socialLinks.instagram}
                      onChange={(e) =>
                        setChannelForm({
                          ...channelForm,
                          socialLinks: {
                            ...channelForm.socialLinks,
                            instagram: e.target.value,
                          },
                        })
                      }
                      disabled={loading}
                      placeholder="https://instagram.com/username"
                    />
                  </div>
                  <div className="form-group">
                    <label>LinkedIn</label>
                    <input
                      type="url"
                      value={channelForm.socialLinks.linkedin}
                      onChange={(e) =>
                        setChannelForm({
                          ...channelForm,
                          socialLinks: {
                            ...channelForm.socialLinks,
                            linkedin: e.target.value,
                          },
                        })
                      }
                      disabled={loading}
                      placeholder="https://linkedin.com/in/username"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowChannelEditModal(false)}
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
                      <FaSpinner className="spinner" /> Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Video Modal */}
      {showCreateVideoModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateVideoModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Upload New Video</h2>
              <button
                onClick={() => setShowCreateVideoModal(false)}
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
                  required
                  disabled={loading}
                  className={formErrors.title ? "input-error" : ""}
                  placeholder="Enter video title"
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
                  rows="3"
                  disabled={loading}
                  placeholder="Enter video description"
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
                    required
                    disabled={loading}
                    className={formErrors.videoUrl ? "input-error" : ""}
                    placeholder="https://www.youtube.com/embed/VIDEO_ID"
                  />
                  {formErrors.videoUrl ? (
                    <span className="error-text">{formErrors.videoUrl}</span>
                  ) : (
                    <small className="help-text">
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
                    required
                    disabled={loading}
                    className={formErrors.thumbnailUrl ? "input-error" : ""}
                    placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
                  />
                  {formErrors.thumbnailUrl ? (
                    <span className="error-text">
                      {formErrors.thumbnailUrl}
                    </span>
                  ) : (
                    <small className="help-text">
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
                    disabled={loading}
                    placeholder="react, tutorial, javascript"
                  />
                  <small className="help-text">
                    Add relevant tags to help viewers find your video
                  </small>
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={videoForm.isPublished}
                    onChange={(e) =>
                      setVideoForm({
                        ...videoForm,
                        isPublished: e.target.checked,
                      })
                    }
                    disabled={loading}
                  />
                  <span>Publish immediately</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateVideoModal(false)}
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
                      <FaSpinner className="spinner" /> Uploading...
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
      {showEditVideoModal && selectedVideo && (
        <div
          className="modal-overlay"
          onClick={() => setShowEditVideoModal(false)}
        >
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Video</h2>
              <button
                onClick={() => setShowEditVideoModal(false)}
                className="modal-close"
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
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={videoForm.isPublished}
                    onChange={(e) =>
                      setVideoForm({
                        ...videoForm,
                        isPublished: e.target.checked,
                      })
                    }
                    disabled={loading}
                  />
                  <span>Published</span>
                </label>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowEditVideoModal(false)}
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
                      <FaSpinner className="spinner" /> Updating...
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

      {/* Delete Channel Confirmation Modal */}
      {showDeleteChannelConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteChannelConfirm(false)}
        >
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Channel</h2>
              <button
                onClick={() => setShowDeleteChannelConfirm(false)}
                className="modal-close"
              >
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="delete-confirmation">
                <FaTrash size={40} color="#f44336" />
                <h3>⚠️ Warning!</h3>
                <p>You are about to delete your entire channel:</p>
                <p className="channel-name-to-delete">{channel.channelName}</p>
                <div className="warning-details">
                  <p>This will:</p>
                  <ul>
                    <li>Delete all {videos.length} videos in this channel</li>
                    <li>
                      Remove all subscribers ({channel.subscriberCount || 0})
                    </li>
                    <li>Delete all channel settings and data</li>
                  </ul>
                  <p className="text-danger">
                    <strong>This action cannot be undone!</strong>
                  </p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setShowDeleteChannelConfirm(false)}
                className="btn btn-secondary"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteChannel}
                className="btn btn-danger"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinner" /> Deleting Channel...
                  </>
                ) : (
                  "Delete Channel"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageChannel;
