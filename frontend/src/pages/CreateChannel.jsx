import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { channelAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { FaYoutube, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import "./CreateChannel.css";

const CreateChannel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
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

    // Validate form
    if (!formData.channelName.trim()) {
      setError("Channel name is required");
      return;
    }

    if (formData.channelName.trim().length < 3) {
      setError("Channel name must be at least 3 characters long");
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("📤 Creating channel:", formData);

      const response = await channelAPI.createChannel(formData);
      console.log("✅ Channel created:", response.data);

      setSuccess(true);

      // Show success message for 2 seconds, then redirect
      setTimeout(() => {
        if (response.data && response.data._id) {
          navigate(`/channel/${response.data._id}`);
        } else {
          navigate("/");
        }
      }, 2000);
    } catch (err) {
      console.error("❌ Error creating channel:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to create channel. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleTestRedirect = () => {
    // If you want to test with a specific channel ID
    const testChannelId = "695147cc8e3f8dc09685f6db"; // Replace with actual channel ID
    navigate(`/channel/${testChannelId}`);
  };

  if (!user) {
    return (
      <div className="not-logged-in">
        <FaYoutube size={60} color="#FF0000" />
        <h2>Please login to create a channel</h2>
        <p>You need to be logged in to create and manage your own channel.</p>
        <button onClick={() => navigate("/auth")} className="login-btn">
          Go to Login
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="success-container">
        <div className="success-card">
          <FaCheckCircle size={80} color="#4CAF50" />
          <h1>Channel Created Successfully!</h1>
          <p>Your channel "{formData.channelName}" has been created.</p>
          <p>Redirecting to your channel page...</p>
          <div className="loading-spinner"></div>
          <button
            onClick={() => navigate(`/channel/695147cc8e3f8dc09685f6db`)} // Replace with actual ID
            className="go-to-channel-btn"
          >
            Go to Channel Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-channel-container">
      <div className="create-channel-card">
        <div className="create-channel-header">
          <button onClick={() => navigate(-1)} className="back-btn">
            <FaArrowLeft /> Back
          </button>
          <h1>
            <FaYoutube /> Create Your Channel
          </h1>
          <p className="subtitle">Share your content with the world</p>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="create-channel-form">
          <div className="form-group">
            <label htmlFor="channelName">
              Channel Name *<span className="required-star">*</span>
            </label>
            <input
              type="text"
              id="channelName"
              value={formData.channelName}
              onChange={(e) =>
                setFormData({ ...formData, channelName: e.target.value })
              }
              placeholder="Enter your channel name (e.g., 'Tech Tutorials')"
              required
              minLength="3"
              maxLength="50"
              disabled={loading}
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
              placeholder="Describe what your channel is about. What kind of content will you create?"
              rows="4"
              maxLength="500"
              disabled={loading}
            />
            <small className="help-text">
              Optional: Tell viewers about your channel (max 500 characters)
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
              placeholder="https://example.com/banner.jpg (optional)"
              disabled={loading}
            />
            <small className="help-text">
              Optional: Add a banner image for your channel (recommended size:
              1200x300)
            </small>
          </div>

          {/* Preview Section */}
          <div className="form-preview">
            <h3>Preview</h3>
            <div className="preview-banner">
              {formData.channelBanner ? (
                <img
                  src={formData.channelBanner}
                  alt="Channel banner preview"
                  onError={(e) => {
                    e.target.style.display = "none";
                    e.target.parentElement.innerHTML =
                      '<div class="preview-placeholder">Channel Banner Preview</div>';
                  }}
                />
              ) : (
                <div className="preview-placeholder">Channel Banner</div>
              )}
            </div>
            <div className="preview-info">
              <h4>{formData.channelName || "Your Channel Name"}</h4>
              <p className="preview-owner">
                <img
                  src={user.avatar}
                  alt={user.username}
                  className="preview-owner-avatar"
                />
                {user.username}
              </p>
              <p className="preview-description">
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
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating...
                </>
              ) : (
                "Create Channel"
              )}
            </button>
          </div>
        </form>

        {/* Debug Section - Remove in production */}
        <div className="debug-section">
          <h4>Debug Info:</h4>
          <p>User ID: {user._id}</p>
          <p>Username: {user.username}</p>
          <button onClick={handleTestRedirect} className="test-btn">
            Test Channel View (Debug)
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateChannel;
