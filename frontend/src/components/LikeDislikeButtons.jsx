// frontend/src/components/LikeDislikeButtons.jsx
import React, { useState, useEffect, useCallback } from "react";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { videoAPI } from "../services/api";
import { useAuth } from "../context/AuthContext"; // ✅ Use the Auth Context
import "./LikeDislikeButtons.css";

const LikeDislikeButtons = ({
  videoId,
  initialLikes = [],
  initialDislikes = [],
  onUpdate,
}) => {
  const [likes, setLikes] = useState([]);
  const [dislikes, setDislikes] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Use the Auth Context to get user and auth state
  const { user, isAuthenticated, logout } = useAuth();

  useEffect(() => {
    setLikes(Array.isArray(initialLikes) ? initialLikes : []);
    setDislikes(Array.isArray(initialDislikes) ? initialDislikes : []);
  }, [initialLikes, initialDislikes]);

  // ✅ Consolidated API Call Handler
  const handleReaction = useCallback(
    async (actionType) => {
      // 1. CHECK AUTHENTICATION
      if (!isAuthenticated() || !user) {
        alert("Please login to interact with videos.");
        window.location.href = "/auth";
        return;
      }

      // 2. Get token directly before request
      const token = localStorage.getItem("token");
      if (!token) {
        alert("Your session is invalid. Please login again.");
        logout();
        return;
      }

      try {
        setLoading(true);
        console.log(`🔄 ${actionType} video ${videoId} for user ${user._id}`);

        // 3. MAKE API REQUEST
        const response =
          actionType === "like"
            ? await videoAPI.likeVideo(videoId)
            : await videoAPI.dislikeVideo(videoId);

        console.log(`✅ ${actionType} response:`, response.data);

        // 4. UPDATE STATE
        if (response.data) {
          // Handle both possible response structures from backend
          const newLikes =
            response.data.likesArray || response.data.likes || [];
          const newDislikes =
            response.data.dislikesArray || response.data.dislikes || [];

          setLikes(newLikes);
          setDislikes(newDislikes);

          if (onUpdate) {
            onUpdate({ likes: newLikes, dislikes: newDislikes });
          }
        }
      } catch (error) {
        console.error(`❌ Error ${actionType} video:`, error);

        // 5. HANDLE SPECIFIC ERRORS
        if (error.response?.status === 401) {
          // Token is invalid or expired
          alert("Your session has expired. Please login again.");
          logout();
        } else {
          // Other errors (network, server, etc.)
          alert(
            error.response?.data?.message || `Failed to ${actionType} video.`
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [videoId, user, isAuthenticated, logout, onUpdate]
  );

  // Separate handlers for UI clarity
  const handleLike = () => handleReaction("like");
  const handleDislike = () => handleReaction("dislike");

  // Determine if current user has liked/disliked
  const userLiked =
    user &&
    likes.some(
      (likeId) =>
        (typeof likeId === "object" ? likeId._id : likeId) === user._id
    );
  const userDisliked =
    user &&
    dislikes.some(
      (dislikeId) =>
        (typeof dislikeId === "object" ? dislikeId._id : dislikeId) === user._id
    );

  return (
    <div className="like-dislike-container">
      <div className="like-dislike-stats">
        <span>{likes.length} likes</span> •{" "}
        <span>{dislikes.length} dislikes</span>
      </div>
      <div className="like-dislike-buttons">
        <button
          className={`like-btn ${userLiked ? "active" : ""}`}
          onClick={handleLike}
          disabled={loading}
          title={isAuthenticated() ? "Like this video" : "Login to like"}
        >
          <FaThumbsUp /> Like {userLiked && "✓"}
        </button>
        <button
          className={`dislike-btn ${userDisliked ? "active" : ""}`}
          onClick={handleDislike}
          disabled={loading}
          title={isAuthenticated() ? "Dislike this video" : "Login to dislike"}
        >
          <FaThumbsDown /> Dislike {userDisliked && "✓"}
        </button>
      </div>
    </div>
  );
};

export default LikeDislikeButtons;
