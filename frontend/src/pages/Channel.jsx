import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { channelAPI, videoAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import VideoCard from "../components/VideoCard";
import { FaEdit, FaTrash, FaPlus, FaUpload, FaYoutube } from "react-icons/fa";
import "./Channel.css";

const Channel = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [channel, setChannel] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [videoForm, setVideoForm] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    category: "Education",
    tags: "",
  });

  useEffect(() => {
    fetchChannel();
  }, [id]);

  const fetchChannel = async () => {
    try {
      setLoading(true);
      const channelResponse = await channelAPI.getChannel(id);
      setChannel(channelResponse.data);
      setVideos(channelResponse.data.videos || []);
    } catch (error) {
      console.error("Error fetching channel:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVideo = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to upload videos");
      return;
    }

    try {
      const videoData = {
        ...videoForm,
        channelId: id,
        uploader: user._id,
        tags: videoForm.tags.split(",").map((tag) => tag.trim()),
      };

      const response = await videoAPI.createVideo(videoData);
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
      console.error("Error creating video:", error);
      alert("Failed to upload video");
    }
  };

  const handleUpdateVideo = async (e) => {
    e.preventDefault();
    try {
      const videoData = {
        ...videoForm,
        tags: videoForm.tags.split(",").map((tag) => tag.trim()),
      };

      await videoAPI.updateVideo(selectedVideo._id, videoData);
      setVideos((prev) =>
        prev.map((v) =>
          v._id === selectedVideo._id ? { ...v, ...videoData } : v
        )
      );
      setShowEditModal(false);
      setSelectedVideo(null);
      alert("Video updated successfully!");
    } catch (error) {
      console.error("Error updating video:", error);
      alert("Failed to update video");
    }
  };

  const handleDeleteVideo = async (videoId) => {
    if (!window.confirm("Are you sure you want to delete this video?")) return;

    try {
      await videoAPI.deleteVideo(videoId);
      setVideos((prev) => prev.filter((v) => v._id !== videoId));
      alert("Video deleted successfully!");
    } catch (error) {
      console.error("Error deleting video:", error);
      alert("Failed to delete video");
    }
  };

  // Add video function
  const handleAddVideo = async (e) => {
    e.preventDefault();
    try {
      const videoData = {
        ...videoForm,
        channelId: id,
        uploader: user._id,
        tags: videoForm.tags.split(",").map((tag) => tag.trim()),
      };

      const response = await videoAPI.createVideo(videoData);
      setVideos([response.data, ...videos]);
      setShowVideoModal(false);
      alert("Video uploaded successfully!");
    } catch (error) {
      console.error("Error uploading video:", error);
      alert("Failed to upload video");
    }
  };

  const isChannelOwner = () => {
    return user && channel && channel.owner._id === user._id;
  };

  if (loading) {
    return <div className="loading">Loading channel...</div>;
  }

  if (!channel) {
    return (
      <div className="not-found">
        <h2>Channel not found</h2>
        <button onClick={() => navigate("/")}>Back to Home</button>
      </div>
    );
  }

  return (
    <div className="channel-page">
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
            />
            <div className="channel-info">
              <h1 className="channel-name">{channel.channelName}</h1>
              <p className="channel-stats">
                {channel.subscribers?.length || 0} subscribers • {videos.length}{" "}
                videos
              </p>
              <p className="channel-description">{channel.description}</p>
              {isChannelOwner() && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="upload-video-btn"
                >
                  <FaUpload /> Upload Video
                </button>
              )}
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
                          title: video.title,
                          description: video.description,
                          videoUrl: video.videoUrl,
                          thumbnailUrl: video.thumbnailUrl,
                          category: video.category,
                          tags: video.tags?.join(", ") || "",
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
                  Use YouTube embed URL or direct video link
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
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Upload Video
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Video Modal */}
      {showEditModal && (
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
                >
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  Update Video
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
