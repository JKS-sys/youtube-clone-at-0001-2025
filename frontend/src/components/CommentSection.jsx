// frontend/src/components/CommentSection.jsx
import React, { useState, useEffect } from "react";
import {
  FaUserCircle,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { videoAPI } from "../services/api";
import "./CommentSection.css";

const CommentSection = ({ videoId, initialComments = [], onUpdate }) => {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
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

  const user = getCurrentUser();
  const isAuthenticated = !!localStorage.getItem("token");

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check authentication
    if (!isAuthenticated || !user) {
      alert("Please login to add a comment");
      window.location.href = "/auth";
      return;
    }

    if (!newComment.trim()) return;

    try {
      setLoading(true);
      console.log("💬 Submitting comment for video:", videoId);

      const response = await videoAPI.addComment(videoId, newComment);

      // Add the new comment to the list
      setComments((prev) => [...prev, response.data]);
      setNewComment("");

      if (onUpdate) {
        onUpdate();
      }

      console.log("✅ Comment added successfully");
    } catch (error) {
      console.error("❌ Error adding comment:", error);

      if (error.response?.status === 401) {
        // Token is invalid
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Your session has expired. Please login again.");
        window.location.href = "/auth";
      } else if (error.message === "No authentication token") {
        // No token at all
        alert("Please login to add a comment");
        window.location.href = "/auth";
      } else {
        alert("Failed to add comment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (commentId) => {
    if (!editText.trim()) return;

    try {
      setLoading(true);
      await videoAPI.updateComment(videoId, commentId, editText);

      // Update the comment in the list
      setComments((prev) =>
        prev.map((comment) =>
          comment._id === commentId ? { ...comment, text: editText } : comment
        )
      );

      setEditingComment(null);
      setEditText("");

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error updating comment:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Your session has expired. Please login again.");
        window.location.href = "/auth";
      } else {
        alert("Failed to update comment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      setLoading(true);
      await videoAPI.deleteComment(videoId, commentId);

      // Remove the comment from the list
      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId)
      );

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error deleting comment:", error);

      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        alert("Your session has expired. Please login again.");
        window.location.href = "/auth";
      } else {
        alert("Failed to delete comment. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText("");
  };

  const isCommentOwner = (comment) => {
    return user && comment.userId && comment.userId._id === user._id;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <div className="comment-section">
      <h3 className="comment-section__title">
        {comments.length} Comment{comments.length !== 1 ? "s" : ""}
      </h3>

      {/* Comment Form */}
      {isAuthenticated ? (
        <form onSubmit={handleSubmit} className="comment-section__form">
          <div className="comment-section__input-group">
            <img
              src={
                user?.avatar ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt={user?.username || "User"}
              className="comment-section__avatar"
              onError={(e) => {
                e.target.src =
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png";
              }}
            />
            <div className="comment-section__input-wrapper">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="comment-section__input"
                disabled={loading}
              />
              <div className="comment-section__actions">
                <button
                  type="button"
                  className="comment-section__cancel-btn"
                  onClick={() => setNewComment("")}
                  disabled={!newComment || loading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="comment-section__submit-btn"
                  disabled={!newComment.trim() || loading}
                >
                  {loading ? "Posting..." : "Comment"}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="comment-section__login-prompt">
          <p>
            Please <a href="/auth">log in</a> to leave a comment.
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="comment-section__list">
        {comments.map((comment) => (
          <div key={comment._id || comment.commentId} className="comment">
            <img
              src={
                comment.userId?.avatar ||
                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
              }
              alt={comment.userId?.username || "User"}
              className="comment__avatar"
              onError={(e) => {
                e.target.src =
                  "https://cdn-icons-png.flaticon.com/512/149/149071.png";
              }}
            />
            <div className="comment__content">
              <div className="comment__header">
                <span className="comment__author">
                  {comment.userId?.username || "Anonymous"}
                </span>
                <span className="comment__date">
                  {formatDate(comment.createdAt || comment.timestamp)}
                </span>
              </div>

              {editingComment === comment._id ? (
                <div className="comment__edit-form">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="comment__edit-input"
                    rows="3"
                  />
                  <div className="comment__edit-actions">
                    <button
                      onClick={() => handleUpdate(comment._id)}
                      className="comment__save-btn"
                      disabled={!editText.trim() || loading}
                    >
                      <FaCheck /> Save
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      className="comment__cancel-btn"
                      disabled={loading}
                    >
                      <FaTimes /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <p className="comment__text">{comment.text}</p>

                  {isCommentOwner(comment) && (
                    <div className="comment__owner-actions">
                      <button
                        onClick={() => {
                          setEditingComment(comment._id);
                          setEditText(comment.text);
                        }}
                        className="comment__action-btn"
                        title="Edit comment"
                      >
                        <FaEdit /> Edit
                      </button>
                      <button
                        onClick={() => handleDelete(comment._id)}
                        className="comment__action-btn comment__action-btn--delete"
                        title="Delete comment"
                      >
                        <FaTrash /> Delete
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CommentSection;
