import React, { useState } from "react";
import { videoAPI } from "../services/api";
import { FaUpload, FaTimes } from "react-icons/fa";
import "./VideoUploadForm.css";

const VideoUploadForm = ({ channelId, onSuccess, onClose }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    videoUrl: "",
    thumbnailUrl: "",
    category: "Education",
    tags: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !formData.title.trim() ||
      !formData.videoUrl.trim() ||
      !formData.thumbnailUrl.trim()
    ) {
      setError("Title, video URL, and thumbnail URL are required");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const videoData = {
        ...formData,
        channelId,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
      };

      const response = await videoAPI.createVideo(videoData);

      if (response.data.success) {
        alert("🎉 Video uploaded successfully!");
        setFormData({
          title: "",
          description: "",
          videoUrl: "",
          thumbnailUrl: "",
          category: "Education",
          tags: "",
        });
        if (onSuccess) onSuccess(response.data.video);
        if (onClose) onClose();
      }
    } catch (err) {
      console.error("Upload error:", err);
      setError(err.response?.data?.message || "Failed to upload video");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="video-upload-form-overlay">
      <div className="video-upload-form">
        <div className="form-header">
          <h3>Upload New Video</h3>
          <button onClick={onClose} className="close-btn">
            <FaTimes />
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter video title"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
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
                name="videoUrl"
                value={formData.videoUrl}
                onChange={handleChange}
                placeholder="https://www.youtube.com/embed/VIDEO_ID"
                required
                disabled={loading}
              />
              <small className="help-text">Use YouTube embed URL</small>
            </div>

            <div className="form-group">
              <label>Thumbnail URL *</label>
              <input
                type="url"
                name="thumbnailUrl"
                value={formData.thumbnailUrl}
                onChange={handleChange}
                placeholder="https://img.youtube.com/vi/VIDEO_ID/maxresdefault.jpg"
                required
                disabled={loading}
              />
              <small className="help-text">YouTube thumbnail URL</small>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
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
          </div>

          <div className="form-group">
            <label>Tags (comma separated)</label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              placeholder="react, tutorial, javascript"
              disabled={loading}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={onClose}
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
                "Uploading..."
              ) : (
                <>
                  <FaUpload /> Upload Video
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default VideoUploadForm;
