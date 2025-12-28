import React, { useState, useEffect } from "react";
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
} from "react-icons/fa";
import "./Channel.css";

const Channel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    category: "Education",
    tags: "",
  });

  useEffect(() => {
    if (id) {
      fetchChannel();
    }
    // Add this function in your Channel.jsx component to debug
    const debugChannelData = () => {
      console.log("🔍 Channel Debug Info:");
      console.log("Channel Object:", channel);
      console.log("Channel ID:", id);
      console.log("Channel Owner:", channel?.owner);
      console.log("Current User:", user);
      console.log("Is Channel Owner?", isChannelOwner());
      console.log("Videos:", videos);

      // Check localStorage for channel data
      const allChannels = JSON.parse(
        localStorage.getItem("userChannels") || "[]"
      );
      console.log("User Channels from localStorage:", allChannels);
    };
  }, [id]);

  const fetchChannel = async () => {
    try {
      setLoading(true);
      setError("");
      console.log("📡 Fetching channel:", id);

      const channelResponse = await channelAPI.getChannel(id);
      console.log("📦 Channel response:", channelResponse.data);

      setChannel(channelResponse.data);

      // Get videos separately if needed
      if (
        channelResponse.data.videos &&
        channelResponse.data.videos.length > 0
      ) {
        setVideos(channelResponse.data.videos);
      } else {
        // If no videos in channel response, fetch videos for this channel
        const videosResponse = await videoAPI.getVideos();
        const channelVideos = videosResponse.data.filter(
          (video) => video.channelId && video.channelId._id === id
        );
        setVideos(channelVideos);
      }
    } catch (error) {
      console.error("❌ Error fetching channel:", error);
      setError("Failed to load channel. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVideo = async (e) => {
    e.preventDefault();

    if (!user) {
      alert("Please login to upload videos");
      navigate("/auth");
      return;
    }

    if (
      !videoForm.title.trim() ||
      !videoForm.videoUrl.trim() ||
      !videoForm.thumbnailUrl.trim()
    ) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const videoData = {
        ...videoForm,
        channelId: id,
        uploader: user._id,
        tags: videoForm.tags
          ? videoForm.tags.split(",").map((tag) => tag.trim())
          : [],
      };

      console.log("📤 Creating video:", videoData);

      const response = await videoAPI.createVideo(videoData);
      console.log("✅ Video created:", response.data);

      // Add the new video to the list
      setVideos((prev) => [response.data, ...prev]);
      setShowCreateModal(false);
      setVideoForm({
        title: "",
        description: "",
        videoUrl: "",
        thumbnailUrl: "",
        category: "Education",
        tags: "",
      });

      alert("Video uploaded successfully!");
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
          ? videoForm.tags.split(",").map((tag) => tag.trim())
          : [],
      };

      console.log("📤 Updating video:", selectedVideo._id, videoData);

      const response = await videoAPI.updateVideo(selectedVideo._id, videoData);
      console.log("✅ Video updated:", response.data);

      // Update the video in the list
      setVideos((prev) =>
        prev.map((video) =>
          video._id === selectedVideo._id ? response.data : video
        )
      );

      setShowEditModal(false);
      setSelectedVideo(null);
      alert("Video updated successfully!");
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

      alert("Video deleted successfully!");
    } catch (error) {
      console.error("❌ Error deleting video:", error);
      alert(error.response?.data?.message || "Failed to delete video");
    } finally {
      setLoading(false);
    }
  };

  const isChannelOwner = () => {
    if (!user || !channel) return false;
    return (
      channel.owner &&
      (channel.owner._id === user._id || channel.owner === user._id)
    );
  };

  if (loading) {
    return (
      <div
        className="loading"
        style={{
          padding: "100px",
          textAlign: "center",
          fontSize: "18px",
        }}
      >
        <div
          className="loading-spinner"
          style={{
            width: "50px",
            height: "50px",
            border: "3px solid #f3f3f3",
            borderTop: "3px solid #ff0000",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 20px",
          }}
        ></div>
        Loading channel...
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="error"
        style={{
          padding: "100px",
          textAlign: "center",
        }}
      >
        <h2 style={{ color: "#ff0000", marginBottom: "20px" }}>Error</h2>
        <p style={{ marginBottom: "30px" }}>{error}</p>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 20px",
            background: "#065fd4",
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  if (!channel) {
    return (
      <div
        className="not-found"
        style={{
          padding: "100px",
          textAlign: "center",
        }}
      >
        <h2>Channel not found</h2>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: "10px 20px",
            background: "#065fd4",
            color: "white",
            border: "none",
            borderRadius: "20px",
            cursor: "pointer",
            marginTop: "20px",
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="channel-page">
      {/* Debug Info - Remove in production */}
      <div
        style={{
          padding: "10px",
          margin: "10px",
          background: "#f0f0f0",
          borderRadius: "5px",
          fontSize: "12px",
          fontFamily: "monospace",
        }}
      >
        <strong>Debug:</strong> Channel ID: {id} | Videos: {videos.length} |
        Owner: {channel.owner?.username || channel.owner} | User:{" "}
        {user?._id || "Not logged in"}
      </div>

      {/* Channel Banner */}
      <div
        className="channel-banner"
        style={{
          backgroundImage: `url(${
            channel.channelBanner || "https://picsum.photos/1200/300"
          })`,
          backgroundColor: channel.channelBanner ? "transparent" : "#f0f0f0",
        }}
      >
        <div className="banner-overlay">
          <div className="channel-header">
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
            <div className="channel-info">
              <h1 className="channel-name">{channel.channelName}</h1>
              <p className="channel-stats">
                {channel.subscribers?.length || 0} subscribers • {videos.length}{" "}
                videos
              </p>
              <p className="channel-description">{channel.description}</p>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                {isChannelOwner() && (
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="upload-video-btn"
                  >
                    <FaUpload /> Upload Video
                  </button>
                )}
                <button
                  onClick={fetchChannel}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    background: "#f2f2f2",
                    color: "#606060",
                    border: "none",
                    borderRadius: "20px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  <FaSyncAlt /> Refresh
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="channel-content">
        <div className="videos-header">
          <h2>Videos ({videos.length})</h2>
          {isChannelOwner() && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="add-video-btn"
            >
              <FaPlus /> Add Video
            </button>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="no-videos">
            <FaYoutube size={50} color="#ccc" />
            <h3>No videos yet</h3>
            <p style={{ color: "#909090", margin: "10px 0 20px" }}>
              {isChannelOwner()
                ? "Upload your first video to get started!"
                : "This channel hasn't uploaded any videos yet."}
            </p>
            {isChannelOwner() && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="upload-first-btn"
              >
                Upload your first video
              </button>
            )}
          </div>
        ) : (
          <div className="channel-videos">
            {videos.map((video) => (
              <div key={video._id} className="video-item">
                <VideoCard video={video} />
                {isChannelOwner() && (
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
                      className="edit-btn"
                    >
                      <FaEdit /> Edit
                    </button>
                    <button
                      onClick={() => handleDeleteVideo(video._id)}
                      className="delete-btn"
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
        <div className="modal-overlay">
          <div className="modal">
            <h2>Upload Video</h2>
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
                  placeholder="Enter video title"
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
                />
              </div>
              <div className="form-group">
                <label>Video URL *</label>
                <input
                  type="url"
                  value={videoForm.videoUrl}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, videoUrl: e.target.value })
                  }
                  required
                  placeholder="https://example.com/video.mp4"
                />
                <small className="help-text">
                  Use direct video links or YouTube embed URLs
                </small>
              </div>
              <div className="form-group">
                <label>Thumbnail URL *</label>
                <input
                  type="url"
                  value={videoForm.thumbnailUrl}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, thumbnailUrl: e.target.value })
                  }
                  required
                  placeholder="https://example.com/thumbnail.jpg"
                />
                <small className="help-text">
                  Use an image URL for the video thumbnail
                </small>
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={videoForm.category}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, category: e.target.value })
                  }
                  required
                >
                  <option value="Music">Music</option>
                  <option value="Sports">Sports</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
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
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Uploading..." : "Upload Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditModal && selectedVideo && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Edit Video</h2>
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
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  value={videoForm.description}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, description: e.target.value })
                  }
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Video URL *</label>
                <input
                  type="url"
                  value={videoForm.videoUrl}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, videoUrl: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Thumbnail URL *</label>
                <input
                  type="url"
                  value={videoForm.thumbnailUrl}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, thumbnailUrl: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>Category *</label>
                <select
                  value={videoForm.category}
                  onChange={(e) =>
                    setVideoForm({ ...videoForm, category: e.target.value })
                  }
                  required
                >
                  <option value="Music">Music</option>
                  <option value="Sports">Sports</option>
                  <option value="Gaming">Gaming</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
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
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setSelectedVideo(null);
                  }}
                  className="cancel-btn"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Updating..." : "Update Video"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Channel;
