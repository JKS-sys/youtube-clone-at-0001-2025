import React, { useState, useEffect, useCallback } from "react";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { videoAPI } from "../services/api";
import "./LikeDislikeButtons.css";

const LikeDislikeButtons = ({
  videoId,
  initialLikes = [],
  initialDislikes = [],
  onUpdate,
}) => {
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [loading, setLoading] = useState(false);

  // Get current user from localStorage
  const getCurrentUser = () => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  };

  // Compute user interaction ONCE, not in useEffect
  const user = getCurrentUser();
  const isAuthenticated = !!localStorage.getItem("token");

  const liked =
    user && user._id && Array.isArray(likes) && likes.includes(user._id);
  const disliked =
    user && user._id && Array.isArray(dislikes) && dislikes.includes(user._id);

  // Update state when props change (but only once)
  useEffect(() => {
    setLikes(initialLikes);
    setDislikes(initialDislikes);
  }, [initialLikes, initialDislikes]);

  const handleLike = useCallback(async () => {
    console.log("🔄 handleLike called for video:", videoId);
    console.log("🔍 User authenticated:", isAuthenticated);
    console.log("🔍 Current user:", user);

    // Check authentication
    if (!isAuthenticated || !user) {
      alert("Please login to like videos");
      window.location.href = "/auth";
      return;
    }

    try {
      setLoading(true);
      console.log(`👍 Making API call to like video ${videoId}`);

      const response = await videoAPI.likeVideo(videoId);
      console.log("✅ Like response:", response.data);

      // Update state
      if (response.data) {
        setLikes(response.data.likes || []);
        setDislikes(response.data.dislikes || []);

        // Callback for parent component
        if (onUpdate) {
          onUpdate({
            likes: response.data.likes || [],
            dislikes: response.data.dislikes || [],
          });
        }
      }
    } catch (error) {
      console.error("❌ Error liking video:", error);

      if (error.response?.status === 401) {
        // Token is invalid
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Your session has expired. Please login again.");
        window.location.href = "/auth";
      } else if (error.response?.status === 404) {
        console.error("❌ 404 Error - Route not found. Check backend routes.");
        alert("Like feature is currently unavailable. Please try again later.");
      } else {
        alert("Failed to like video. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [videoId, isAuthenticated, user, onUpdate]);

  const handleDislike = useCallback(async () => {
    console.log("🔄 handleDislike called for video:", videoId);

    // Check authentication
    if (!isAuthenticated || !user) {
      alert("Please login to dislike videos");
      window.location.href = "/auth";
      return;
    }

    try {
      setLoading(true);
      console.log(`👎 Making API call to dislike video ${videoId}`);

      const response = await videoAPI.dislikeVideo(videoId);
      console.log("✅ Dislike response:", response.data);

      if (response.data) {
        setLikes(response.data.likes || []);
        setDislikes(response.data.dislikes || []);

        if (onUpdate) {
          onUpdate({
            likes: response.data.likes || [],
            dislikes: response.data.dislikes || [],
          });
        }
      }
    } catch (error) {
      console.error("❌ Error disliking video:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Your session has expired. Please login again.");
        window.location.href = "/auth";
      } else if (error.response?.status === 404) {
        console.error("❌ 404 Error - Route not found. Check backend routes.");
        alert(
          "Dislike feature is currently unavailable. Please try again later."
        );
      } else {
        alert("Failed to dislike video. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [videoId, isAuthenticated, user, onUpdate]);

  return (
    <div className="like-dislike-container">
      <div className="like-dislike-stats">
        <span className="stat-item">
          {Array.isArray(likes) ? likes.length : 0} likes
        </span>
        <span className="divider">•</span>
        <span className="stat-item">
          {Array.isArray(dislikes) ? dislikes.length : 0} dislikes
        </span>
      </div>

      <div className="like-dislike-buttons">
        <button
          className={`like-btn ${liked ? "active" : ""}`}
          onClick={handleLike}
          disabled={loading}
          title={isAuthenticated ? "Like this video" : "Login to like"}
        >
          <FaThumbsUp className="icon" />
          <span>Like</span>
          {liked && <span className="checkmark">✓</span>}
        </button>

        <button
          className={`dislike-btn ${disliked ? "active" : ""}`}
          onClick={handleDislike}
          disabled={loading}
          title={isAuthenticated ? "Dislike this video" : "Login to dislike"}
        >
          <FaThumbsDown className="icon" />
          <span>Dislike</span>
          {disliked && <span className="checkmark">✓</span>}
        </button>
      </div>
    </div>
  );
};

export default LikeDislikeButtons;
