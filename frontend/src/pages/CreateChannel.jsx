import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { channelAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./CreateChannel.css";

const CreateChannel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    channelName: "",
    description: "",
    channelBanner: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      alert("Please login to create a channel");
      navigate("/auth");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await channelAPI.createChannel(formData);
      alert("Channel created successfully!");
      navigate(`/channel/${response.data._id}`);
    } catch (err) {
      console.error("Error creating channel:", err);
      setError(err.response?.data?.message || "Failed to create channel");
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="not-logged-in">
        <h2>Please login to create a channel</h2>
        <button onClick={() => navigate("/auth")}>Go to Login</button>
      </div>
    );
  }

  return (
    <div className="create-channel-container">
      <div className="create-channel-card">
        <h1>Create Your Channel</h1>
        <p className="subtitle">Share your content with the world</p>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-channel-form">
          <div className="form-group">
            <label htmlFor="channelName">Channel Name *</label>
            <input
              type="text"
              id="channelName"
              value={formData.channelName}
              onChange={(e) =>
                setFormData({ ...formData, channelName: e.target.value })
              }
              placeholder="Enter your channel name"
              required
              minLength="3"
              maxLength="50"
            />
            <small className="help-text">
              This will be your public channel name (3-50 characters)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe what your channel is about"
              rows="4"
              maxLength="500"
            />
            <small className="help-text">
              Tell viewers about your channel (optional)
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="channelBanner">Banner Image URL</label>
            <input
              type="url"
              id="channelBanner"
              value={formData.channelBanner}
              onChange={(e) =>
                setFormData({ ...formData, channelBanner: e.target.value })
              }
              placeholder="https://example.com/banner.jpg"
            />
            <small className="help-text">
              Add a banner image for your channel (optional)
            </small>
          </div>

          <div className="form-preview">
            <h3>Preview</h3>
            <div className="preview-banner">
              {formData.channelBanner ? (
                <img
                  src={formData.channelBanner}
                  alt="Channel banner preview"
                />
              ) : (
                <div className="preview-placeholder">Channel Banner</div>
              )}
            </div>
            <div className="preview-info">
              <h4>{formData.channelName || "Your Channel Name"}</h4>
              <p>
                {formData.description || "Channel description will appear here"}
              </p>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="cancel-btn"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="submit-btn"
              disabled={loading || !formData.channelName.trim()}
            >
              {loading ? "Creating..." : "Create Channel"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateChannel;
