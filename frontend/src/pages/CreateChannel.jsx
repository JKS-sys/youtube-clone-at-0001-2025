import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { channelAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import {
  FaYoutube,
  FaArrowLeft,
  FaCheckCircle,
  FaExclamationTriangle,
  FaSpinner,
  FaTv,
  FaHome,
} from "react-icons/fa";
import "./CreateChannel.css";

const CreateChannel = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [hasExistingChannel, setHasExistingChannel] = useState(false);
  const [existingChannel, setExistingChannel] = useState(null);
  const [formData, setFormData] = useState({
    channelName: "",
    description: "",
    channelBanner: "",
  });

  // Check if user already has a channel
  useEffect(() => {
    const checkUserChannel = async () => {
      if (!isAuthenticated() || !user) {
        setChecking(false);
        return;
      }

      try {
        setChecking(true);
        const response = await channelAPI.getMyChannel();

        if (response.data && response.data.hasChannel) {
          setHasExistingChannel(true);
          setExistingChannel(response.data);

          // Auto-redirect after 5 seconds
          setTimeout(() => {
            navigate(`/channel/${response.data._id}`);
          }, 5000);
        }
      } catch (error) {
        // 404 means no channel exists, which is fine
        if (error.response?.status !== 404) {
          console.error("Error checking channel:", error);
        }
      } finally {
        setChecking(false);
      }
    };

    checkUserChannel();
  }, [user, isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isAuthenticated()) {
      alert("Please login to create a channel");
      navigate("/auth");
      return;
    }

    // Validation
    if (!formData.channelName.trim()) {
      setError("Channel name is required");
      return;
    }

    if (formData.channelName.trim().length < 3) {
      setError("Channel name must be at least 3 characters long");
      return;
    }

    if (formData.channelName.trim().length > 50) {
      setError("Channel name cannot exceed 50 characters");
      return;
    }

    try {
      setLoading(true);
      setError("");

      console.log("📤 Creating channel:", formData);

      const response = await channelAPI.createChannel(formData);

      if (response.data) {
        setSuccess(true);

        // Store channel info in localStorage for quick access
        localStorage.setItem(
          "userChannel",
          JSON.stringify(response.data.channel)
        );

        // Redirect after 2 seconds
        setTimeout(() => {
          navigate(`/channel/${response.data.channel._id}`);
        }, 2000);
      }
    } catch (err) {
      console.error("❌ Error creating channel:", err);

      if (err.response?.status === 400 && err.response?.data?.existingChannel) {
        setHasExistingChannel(true);
        setExistingChannel(err.response.data.existingChannel);
        setError("You already have a channel. Redirecting...");

        setTimeout(() => {
          navigate(`/channel/${err.response.data.existingChannel._id}`);
        }, 3000);
      } else {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to create channel. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear error when user starts typing
    if (error) setError("");
  };

  if (checking) {
    return (
      <div className="loading-container">
        <div className="loading-spinner">
          <FaSpinner className="spinning" />
        </div>
        <p>Checking your account...</p>
      </div>
    );
  }

  if (!isAuthenticated()) {
    return (
      <div className="auth-required">
        <div className="auth-required-card">
          <FaYoutube size={80} color="#FF0000" />
          <h2>Authentication Required</h2>
          <p>You need to be logged in to create a YouTube channel.</p>
          <div className="auth-actions">
            <Link to="/auth" className="auth-btn auth-btn-login">
              Login to Continue
            </Link>
            <Link to="/" className="auth-btn auth-btn-home">
              <FaHome /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (hasExistingChannel) {
    return (
      <div className="existing-channel-container">
        <div className="existing-channel-card">
          <FaExclamationTriangle size={80} color="#ff9800" />
          <h1>You Already Have a Channel!</h1>
          <div className="existing-channel-info">
            <FaTv size={24} />
            <h3>{existingChannel?.channelName || "Your Channel"}</h3>
          </div>
          <p className="message">
            You can only create one channel per YouTube account.
          </p>
          <p className="redirect-message">
            Redirecting to your channel in <span className="countdown">5</span>{" "}
            seconds...
          </p>
          <div className="action-buttons">
            <button
              onClick={() => navigate(`/channel/${existingChannel?._id}`)}
              className="btn btn-primary"
            >
              <FaTv /> Go to My Channel Now
            </button>
            <button onClick={() => navigate("/")} className="btn btn-secondary">
              <FaHome /> Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="success-container">
        <div className="success-card">
          <FaCheckCircle size={100} color="#4CAF50" />
          <h1>Channel Created Successfully!</h1>
          <p className="success-message">
            Your channel <strong>"{formData.channelName}"</strong> has been
            created.
          </p>
          <p className="redirect-message">
            Redirecting to your channel page...
          </p>
          <div className="loading-spinner">
            <FaSpinner className="spinning" />
          </div>
          <div className="action-buttons">
            <button onClick={() => navigate("/")} className="btn btn-secondary">
              <FaHome /> Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="create-channel-page">
      <div className="create-channel-container">
        <div className="create-channel-header">
          <button
            onClick={() => navigate(-1)}
            className="back-btn"
            disabled={loading}
          >
            <FaArrowLeft /> Back
          </button>
          <h1 className="main-title">
            <FaYoutube className="youtube-icon" /> Create Your Channel
          </h1>
          <p className="subtitle">
            Build your audience and share your content with the world
          </p>
        </div>

        {error && (
          <div className="error-message">
            <FaExclamationTriangle /> {error}
          </div>
        )}

        <div className="create-channel-content">
          <form onSubmit={handleSubmit} className="channel-form">
            <div className="form-section">
              <h3>Channel Details</h3>

              <div className="form-group">
                <label htmlFor="channelName">
                  Channel Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="channelName"
                  name="channelName"
                  value={formData.channelName}
                  onChange={handleInputChange}
                  placeholder="Enter your channel name"
                  required
                  minLength="3"
                  maxLength="50"
                  disabled={loading}
                  className="form-input"
                />
                <div className="form-help">
                  This will be your public channel name (3-50 characters)
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Tell viewers about your channel. What kind of content will you create?"
                  rows="4"
                  maxLength="500"
                  disabled={loading}
                  className="form-textarea"
                />
                <div className="form-help">
                  Optional: Describe your channel to viewers (max 500
                  characters)
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="channelBanner">Banner Image URL</label>
                <input
                  type="url"
                  id="channelBanner"
                  name="channelBanner"
                  value={formData.channelBanner}
                  onChange={handleInputChange}
                  placeholder="https://example.com/banner-image.jpg"
                  disabled={loading}
                  className="form-input"
                />
                <div className="form-help">
                  Optional: Add a banner image for your channel (recommended:
                  1200x300 pixels)
                </div>
              </div>
            </div>

            <div className="preview-section">
              <h3>Channel Preview</h3>
              <div className="channel-preview">
                <div className="preview-banner">
                  {formData.channelBanner ? (
                    <img
                      src={formData.channelBanner}
                      alt="Channel banner preview"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.parentElement.innerHTML =
                          '<div class="banner-placeholder">Channel Banner</div>';
                      }}
                    />
                  ) : (
                    <div className="banner-placeholder">
                      <FaTv size={32} />
                      <span>Channel Banner Preview</span>
                    </div>
                  )}
                </div>
                <div className="preview-info">
                  <h4>{formData.channelName || "Your Channel Name"}</h4>
                  <div className="preview-owner">
                    <img
                      src={user?.avatar}
                      alt={user?.username}
                      className="owner-avatar"
                      onError={(e) => {
                        e.target.src =
                          "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                      }}
                    />
                    <span>{user?.username}</span>
                  </div>
                  <p className="preview-description">
                    {formData.description ||
                      "Channel description will appear here..."}
                  </p>
                  <div className="preview-stats">
                    <span>0 subscribers</span>
                    <span>•</span>
                    <span>0 videos</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button
                type="button"
                onClick={() => navigate("/")}
                className="btn btn-cancel"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-submit"
                disabled={loading || !formData.channelName.trim()}
              >
                {loading ? (
                  <>
                    <FaSpinner className="spinning" />
                    Creating Channel...
                  </>
                ) : (
                  "Create Channel"
                )}
              </button>
            </div>
          </form>

          <div className="info-section">
            <div className="info-card">
              <h4>💡 Tips for a Great Channel</h4>
              <ul>
                <li>
                  Choose a memorable channel name that represents your content
                </li>
                <li>
                  Add a clear description to help viewers understand your
                  channel
                </li>
                <li>
                  Use a high-quality banner image (1200x300 pixels recommended)
                </li>
                <li>Upload your first video to get started!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateChannel;
