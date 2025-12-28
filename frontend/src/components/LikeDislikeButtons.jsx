// frontend/src/components/LikeDislikeButtons.jsx
import React, { useState, useEffect } from "react";
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
  const [userInteraction, setUserInteraction] = useState({
    liked: false,
    disliked: false,
  });

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

  const currentUser = getCurrentUser();
  const isAuthenticated = !!localStorage.getItem("token");

  // Update user interaction state
  useEffect(() => {
    if (currentUser && currentUser._id) {
      const liked = Array.isArray(likes) && likes.includes(currentUser._id);
      const disliked =
        Array.isArray(dislikes) && dislikes.includes(currentUser._id);
      setUserInteraction({ liked, disliked });
    }
  }, [currentUser, likes, dislikes]);

  const handleLike = async () => {
    console.log("🔄 handleLike called");
    console.log("🔍 Auth check:", {
      token: localStorage.getItem("token") ? "Exists" : "Missing",
      user: currentUser,
    });

    // Check authentication
    if (!isAuthenticated || !currentUser) {
      alert("Please login to like videos");
      window.location.href = "/auth";
      return;
    }

    try {
      setLoading(true);

      // Make the API call
      const response = await videoAPI.likeVideo(videoId);

      // Update state
      if (response.data) {
        setLikes(response.data.likes || []);
        setDislikes(response.data.dislikes || []);

        // Update user interaction
        if (currentUser._id) {
          const wasLiked = userInteraction.liked;
          setUserInteraction({
            liked: !wasLiked,
            disliked: false,
          });
        }

        // Callback for parent component
        if (onUpdate) {
          onUpdate({
            likes: response.data.likes || [],
            dislikes: response.data.dislikes || [],
          });
        }

        console.log("✅ Like successful");
      }
    } catch (error) {
      console.error("❌ Error liking video:", error);

      if (error.response?.status === 401) {
        // Token is invalid
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Your session has expired. Please login again.");
        window.location.href = "/auth";
      } else if (error.message === "No authentication token") {
        // No token at all
        alert("Please login to like videos");
        window.location.href = "/auth";
      } else {
        // Other error
        alert("Failed to like video. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    console.log("🔄 handleDislike called");

    // Check authentication
    if (!isAuthenticated || !currentUser) {
      alert("Please login to dislike videos");
      window.location.href = "/auth";
      return;
    }

    try {
      setLoading(true);
      const response = await videoAPI.dislikeVideo(videoId);

      if (response.data) {
        setLikes(response.data.likes || []);
        setDislikes(response.data.dislikes || []);

        if (currentUser._id) {
          const wasDisliked = userInteraction.disliked;
          setUserInteraction({
            liked: false,
            disliked: !wasDisliked,
          });
        }

        if (onUpdate) {
          onUpdate({
            likes: response.data.likes || [],
            dislikes: response.data.dislikes || [],
          });
        }

        console.log("✅ Dislike successful");
      }
    } catch (error) {
      console.error("❌ Error disliking video:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Your session has expired. Please login again.");
        window.location.href = "/auth";
      } else if (error.message === "No authentication token") {
        alert("Please login to dislike videos");
        window.location.href = "/auth";
      } else {
        alert("Failed to dislike video. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

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
          className={`like-btn ${userInteraction.liked ? "active" : ""}`}
          onClick={handleLike}
          disabled={loading}
          title={isAuthenticated ? "Like this video" : "Login to like"}
        >
          <FaThumbsUp className="icon" />
          <span>Like</span>
          {userInteraction.liked && <span className="checkmark">✓</span>}
        </button>

        <button
          className={`dislike-btn ${userInteraction.disliked ? "active" : ""}`}
          onClick={handleDislike}
          disabled={loading}
          title={isAuthenticated ? "Dislike this video" : "Login to dislike"}
        >
          <FaThumbsDown className="icon" />
          <span>Dislike</span>
          {userInteraction.disliked && <span className="checkmark">✓</span>}
        </button>
      </div>
    </div>
  );
};

export default LikeDislikeButtons;
