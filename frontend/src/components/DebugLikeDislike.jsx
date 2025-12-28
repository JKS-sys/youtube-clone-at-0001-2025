import React, { useEffect } from "react";

const DebugLikeDislike = ({ videoId, likes, dislikes }) => {
  const getUser = () => {
    try {
      const userData = localStorage.getItem("user");
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      return null;
    }
  };

  const user = getUser();

  useEffect(() => {
    console.log("🐛 DEBUG Like/Dislike State:", {
      videoId,
      likesCount: Array.isArray(likes) ? likes.length : 0,
      dislikesCount: Array.isArray(dislikes) ? dislikes.length : 0,
      user: user ? { id: user._id, name: user.username } : "No user",
      userHasLiked:
        user && Array.isArray(likes) ? likes.includes(user._id) : false,
      userHasDisliked:
        user && Array.isArray(dislikes) ? dislikes.includes(user._id) : false,
      likesArray: Array.isArray(likes) ? likes : "Not an array",
      dislikesArray: Array.isArray(dislikes) ? dislikes : "Not an array",
    });
  }, [videoId, likes, dislikes, user]);

  if (!user) {
    return (
      <div
        style={{
          padding: "10px",
          background: "#ffebee",
          borderRadius: "5px",
          margin: "10px 0",
        }}
      >
        <strong>Debug:</strong> User not logged in
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "10px",
        background: "#e3f2fd",
        borderRadius: "5px",
        margin: "10px 0",
      }}
    >
      <strong>Debug Info:</strong>
      <div>User ID: {user._id}</div>
      <div>Likes: {Array.isArray(likes) ? likes.length : 0}</div>
      <div>Dislikes: {Array.isArray(dislikes) ? dislikes.length : 0}</div>
      <div>
        User Liked:{" "}
        {user && Array.isArray(likes) && likes.includes(user._id)
          ? "YES ✓"
          : "NO"}
      </div>
      <div>
        User Disliked:{" "}
        {user && Array.isArray(dislikes) && dislikes.includes(user._id)
          ? "YES ✓"
          : "NO"}
      </div>
      <div style={{ fontSize: "12px", color: "#666", marginTop: "5px" }}>
        Check console for detailed state
      </div>
    </div>
  );
};

export default DebugLikeDislike;
