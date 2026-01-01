import React, { useState, useEffect } from "react";
import {
  FaUserCircle,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaSpinner,
} from "react-icons/fa";
import { videoAPI } from "../services/api";
import "./CommentSection.css";

const CommentSection = ({ videoId, initialComments = [], onUpdate }) => {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
      setError("Please login to add a comment");
      setTimeout(() => setError(""), 3000);
      window.location.href = "/auth";
      return;
    }

    if (!newComment.trim()) {
      setError("Comment cannot be empty");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await videoAPI.addComment(videoId, newComment);

      // Add the new comment to the list
      if (response.data && response.data.comment) {
        setComments((prev) => [...prev, response.data.comment]);
      } else if (response.data) {
        // Handle case where comment data is returned directly
        setComments((prev) => [...prev, response.data]);
      }

      setNewComment("");

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error("❌ Error adding comment:", err);
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => {
          window.location.href = "/auth";
        }, 2000);
      } else {
        setError(err.response?.data?.message || "Failed to add comment");
      }
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (commentId) => {
    if (!editText.trim()) {
      setError("Comment cannot be empty");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await videoAPI.updateComment(
        videoId,
        commentId,
        editText
      );

      // Update the comment in the list
      if (response.data && response.data.comment) {
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId ? response.data.comment : comment
          )
        );
      } else {
        // Fallback update
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId ? { ...comment, text: editText } : comment
          )
        );
      }

      setEditingComment(null);
      setEditText("");

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error("Error updating comment:", err);
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => {
          window.location.href = "/auth";
        }, 2000);
      } else {
        setError(err.response?.data?.message || "Failed to update comment");
      }
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      setLoading(true);
      setError("");

      await videoAPI.deleteComment(videoId, commentId);

      // Remove the comment from the list
      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId)
      );

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error("Error deleting comment:", err);
      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setTimeout(() => {
          window.location.href = "/auth";
        }, 2000);
      } else {
        setError(err.response?.data?.message || "Failed to delete comment");
      }
      setTimeout(() => setError(""), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingComment(null);
    setEditText("");
  };

  const isCommentOwner = (comment) => {
    if (!user || !comment) return false;
    return (
      user._id &&
      comment.userId &&
      (comment.userId._id === user._id || comment.userId === user._id)
    );
  };

  const isVideoOwner = () => {
    // This would need video data to check, but for now we'll just check if user is logged in
    return isAuthenticated;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "just now";

    try {
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
    } catch (error) {
      return "recently";
    }
  };

  return (
    <div className="comment-section">
      <h3 className="comment-section__title">
        {comments.length} Comment{comments.length !== 1 ? "s" : ""}
      </h3>

      {/* Error Message */}
      {error && (
        <div className="comment-section__error">
          <span className="error-text">{error}</span>
        </div>
      )}

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
                  {loading ? (
                    <>
                      <FaSpinner className="spinner" /> Posting...
                    </>
                  ) : (
                    "Comment"
                  )}
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
        {comments.map((comment, index) => {
          const commentId =
            comment._id || comment.commentId || `comment-${index}`;
          const userId = comment.userId?._id || comment.userId;
          const username = comment.userId?.username || "Anonymous";
          const avatar =
            comment.userId?.avatar ||
            "https://cdn-icons-png.flaticon.com/512/149/149071.png";

          return (
            <div key={commentId} className="comment">
              <img
                src={avatar}
                alt={username}
                className="comment__avatar"
                onError={(e) => {
                  e.target.src =
                    "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                }}
              />
              <div className="comment__content">
                <div className="comment__header">
                  <span className="comment__author">{username}</span>
                  <span className="comment__date">
                    {formatDate(comment.createdAt || comment.timestamp)}
                  </span>
                </div>

                {editingComment === commentId ? (
                  <div className="comment__edit-form">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="comment__edit-input"
                      rows="3"
                    />
                    <div className="comment__edit-actions">
                      <button
                        onClick={() => handleUpdate(commentId)}
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

                    {(isCommentOwner(comment) || isVideoOwner()) && (
                      <div className="comment__owner-actions">
                        {isCommentOwner(comment) && (
                          <button
                            onClick={() => {
                              setEditingComment(commentId);
                              setEditText(comment.text);
                            }}
                            className="comment__action-btn"
                            title="Edit comment"
                            disabled={loading}
                          >
                            <FaEdit /> Edit
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(commentId)}
                          className="comment__action-btn comment__action-btn--delete"
                          title="Delete comment"
                          disabled={loading}
                        >
                          <FaTrash /> Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CommentSection;
