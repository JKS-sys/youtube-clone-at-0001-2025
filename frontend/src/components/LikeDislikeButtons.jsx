// frontend/src/components/LikeDislikeButtons.jsx
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
  const { user, isAuthenticated, getToken } = useAuth();
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [loading, setLoading] = useState(false);
  const [userInteraction, setUserInteraction] = useState({
    liked: false,
    disliked: false,
  });

  // Check authentication on mount and when user changes
  useEffect(() => {
    console.log("🔍 LikeDislikeButtons - Authentication check:", {
      hasUser: !!user,
      isAuthenticated: isAuthenticated(),
      userId: user?._id,
    });
  }, [user]);

  // Update user interaction state
  useEffect(() => {
    if (user && user._id) {
      const liked = Array.isArray(likes) && likes.includes(user._id);
      const disliked = Array.isArray(dislikes) && dislikes.includes(user._id);
      setUserInteraction({ liked, disliked });
    }
  }, [user, likes, dislikes]);

  // Listen for authentication events
  useEffect(() => {
    const handleLogin = () => {
      console.log("🔄 LikeDislikeButtons detected login event");
      window.location.reload(); // Refresh to update state
    };

    const handleUnauthorized = () => {
      console.log("🔐 LikeDislikeButtons detected unauthorized event");
      setUserInteraction({ liked: false, disliked: false });
    };

    window.addEventListener("userLoggedIn", handleLogin);
    window.addEventListener("unauthorized", handleUnauthorized);

    return () => {
      window.removeEventListener("userLoggedIn", handleLogin);
      window.removeEventListener("unauthorized", handleUnauthorized);
    };
  }, []);

  const handleLike = async () => {
    console.log("🔄 handleLike called");

    // Check authentication MULTIPLE ways
    const token = getToken();
    const hasToken = !!token;
    const authCheck = isAuthenticated();

    console.log("🔍 Authentication status:", {
      userObject: !!user,
      tokenExists: hasToken,
      isAuthenticated: authCheck,
      userId: user?._id,
    });

    if (!authCheck || !hasToken) {
      alert("Please login to like videos");
      // Redirect to login page
      window.location.href = "/auth";
      return;
    }

    try {
      setLoading(true);

      // Verify token is still valid by making a test call
      try {
        const testResponse = await fetch(
          `${getBaseURL().replace("/api", "")}/api/auth/me`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!testResponse.ok) {
          throw new Error("Token invalid");
        }
      } catch (testError) {
        console.error("Token validation failed:", testError);
        alert("Your session has expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/auth";
        return;
      }

      // Now make the like request
      const response = await videoAPI.likeVideo(videoId);

      // Update state
      if (response.data) {
        setLikes(response.data.likes || []);
        setDislikes(response.data.dislikes || []);

        // Update user interaction
        if (user && user._id) {
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
        alert("Your session has expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("unauthorized"));
        window.location.href = "/auth";
      } else {
        alert("Failed to like video. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDislike = async () => {
    console.log("🔄 handleDislike called");

    // Check authentication
    if (!isAuthenticated()) {
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

        if (user && user._id) {
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
        alert("Your session has expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("unauthorized"));
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
          title={isAuthenticated() ? "Like this video" : "Login to like"}
        >
          <FaThumbsUp className="icon" />
          <span>Like</span>
          {userInteraction.liked && <span className="checkmark">✓</span>}
        </button>

        <button
          className={`dislike-btn ${userInteraction.disliked ? "active" : ""}`}
          onClick={handleDislike}
          disabled={loading}
          title={isAuthenticated() ? "Dislike this video" : "Login to dislike"}
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
