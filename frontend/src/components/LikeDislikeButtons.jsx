import React, { useState, useEffect } from "react";
import { FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { videoAPI } from "../services/api";
import "./LikeDislikeButtons.css";

const LikeDislikeButtons = ({
  videoId,
  initialLikes = [],
  initialDislikes = [],
  onUpdate,
}) => {
  const { user } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [loading, setLoading] = useState(false);
  const [userInteraction, setUserInteraction] = useState({
    liked: false,
    disliked: false,
  });

  useEffect(() => {
    if (user) {
      const liked = likes.includes(user._id);
      const disliked = dislikes.includes(user._id);
      setUserInteraction({ liked, disliked });
    }
  }, [user, likes, dislikes]);

  const handleLike = async () => {
    if (!user) {
      alert("Please login to like videos");
      return;
    }

    try {
      setLoading(true);
      const response = await videoAPI.likeVideo(videoId);
      setLikes(response.data.likes || []);
      setDislikes(response.data.dislikes || []);

      // Update user interaction state
      setUserInteraction((prev) => {
        const wasLiked = prev.liked;
        return {
          liked: !wasLiked,
          disliked: false,
        };
      });

      if (onUpdate) {
        onUpdate({
          likes: response.data.likes || [],
          dislikes: response.data.dislikes || [],
        });
      }
    } catch (error) {
      console.error("Error liking video:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    if (!user) {
      alert("Please login to dislike videos");
      return;
    }

    try {
      setLoading(true);
      const response = await videoAPI.dislikeVideo(videoId);
      setLikes(response.data.likes || []);
      setDislikes(response.data.dislikes || []);

      // Update user interaction state
      setUserInteraction((prev) => {
        const wasDisliked = prev.disliked;
        return {
          liked: false,
          disliked: !wasDisliked,
        };
      });

      if (onUpdate) {
        onUpdate({
          likes: response.data.likes || [],
          dislikes: response.data.dislikes || [],
        });
      }
    } catch (error) {
      console.error("Error disliking video:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="like-dislike-container">
      <div className="like-dislike-stats">
        <span className="stat-item">{likes.length} likes</span>
        <span className="divider">•</span>
        <span className="stat-item">{dislikes.length} dislikes</span>
      </div>

      <div className="like-dislike-buttons">
        <button
          className={`like-btn ${userInteraction.liked ? "active" : ""}`}
          onClick={handleLike}
          disabled={loading}
          title="Like this video"
        >
          <FaThumbsUp className="icon" />
          <span>Like</span>
          {userInteraction.liked && <span className="checkmark">✓</span>}
        </button>

        <button
          className={`dislike-btn ${userInteraction.disliked ? "active" : ""}`}
          onClick={handleDislike}
          disabled={loading}
          title="Dislike this video"
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
