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
  const [likes, setLikes] = useState([]);
  const [dislikes, setDislikes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Get current user from localStorage
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData && userData !== "undefined") {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      setUser(null);
    }
  }, []);

  // Update state when props change
  useEffect(() => {
    // Ensure initialLikes and initialDislikes are arrays
    if (Array.isArray(initialLikes)) {
      setLikes(initialLikes);
    } else if (initialLikes && typeof initialLikes === "object") {
      // If it's an object with _id, convert to array of IDs
      const likeIds = Object.values(initialLikes).map((item) =>
        typeof item === "object" ? item._id || item : item
      );
      setLikes(likeIds);
    } else {
      setLikes([]);
    }

    if (Array.isArray(initialDislikes)) {
      setDislikes(initialDislikes);
    } else if (initialDislikes && typeof initialDislikes === "object") {
      const dislikeIds = Object.values(initialDislikes).map((item) =>
        typeof item === "object" ? item._id || item : item
      );
      setDislikes(dislikeIds);
    } else {
      setDislikes([]);
    }
  }, [initialLikes, initialDislikes]);

  // Check if user has liked/disliked
  const liked = user && user._id && likes.includes(user._id);
  const disliked = user && user._id && dislikes.includes(user._id);

  const handleLike = useCallback(async () => {
    // Check authentication
    if (!user) {
      alert("Please login to like videos");
      window.location.href = "/auth";
      return;
    }

    try {
      setLoading(true);
      console.log(`👍 Liking video ${videoId} for user ${user._id}`);

      const response = await videoAPI.likeVideo(videoId);
      console.log("✅ Like response:", response.data);

      if (response.data) {
        // Update state with new arrays
        setLikes(response.data.likesArray || []);
        setDislikes(response.data.dislikesArray || []);

        // Callback for parent component if needed
        if (onUpdate) {
          onUpdate({
            likes: response.data.likesArray || [],
            dislikes: response.data.dislikesArray || [],
          });
        }

        // Force UI update
        console.log(
          "🔄 UI Updated - Liked:",
          response.data.likesArray.includes(user._id)
        );
      }
    } catch (error) {
      console.error("❌ Error liking video:", error);
      alert(error.response?.data?.message || "Failed to like video");
    } finally {
      setLoading(false);
    }
  }, [videoId, user, onUpdate]);

  const handleDislike = useCallback(async () => {
    // Check authentication
    if (!user) {
      alert("Please login to dislike videos");
      window.location.href = "/auth";
      return;
    }

    try {
      setLoading(true);
      console.log(`👎 Disliking video ${videoId} for user ${user._id}`);

      const response = await videoAPI.dislikeVideo(videoId);
      console.log("✅ Dislike response:", response.data);

      if (response.data) {
        // Update state with new arrays
        setLikes(response.data.likesArray || []);
        setDislikes(response.data.dislikesArray || []);

        if (onUpdate) {
          onUpdate({
            likes: response.data.likesArray || [],
            dislikes: response.data.dislikesArray || [],
          });
        }

        // Force UI update
        console.log(
          "🔄 UI Updated - Disliked:",
          response.data.dislikesArray.includes(user._id)
        );
      }
    } catch (error) {
      console.error("❌ Error disliking video:", error);
      alert(error.response?.data?.message || "Failed to dislike video");
    } finally {
      setLoading(false);
    }
  }, [videoId, user, onUpdate]);

  // Debug logging
  useEffect(() => {
    console.log("🔍 LikeDislikeButtons State:", {
      videoId,
      likes: likes.length,
      dislikes: dislikes.length,
      user: user ? user._id : "No user",
      liked,
      disliked,
    });
  }, [likes, dislikes, user, liked, disliked, videoId]);

  return (
    <div className="like-dislike-container">
      <div className="like-dislike-stats">
        <span className="stat-item">{likes.length} likes</span>
        <span className="divider">•</span>
        <span className="stat-item">{dislikes.length} dislikes</span>
      </div>

      <div className="like-dislike-buttons">
        <button
          className={`like-btn ${liked ? "active" : ""}`}
          onClick={handleLike}
          disabled={loading}
          title={user ? "Like this video" : "Login to like"}
          data-liked={liked}
        >
          <FaThumbsUp className="icon" />
          <span>Like</span>
          {liked && <span className="checkmark">✓</span>}
        </button>

        <button
          className={`dislike-btn ${disliked ? "active" : ""}`}
          onClick={handleDislike}
          disabled={loading}
          title={user ? "Dislike this video" : "Login to dislike"}
          data-disliked={disliked}
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
