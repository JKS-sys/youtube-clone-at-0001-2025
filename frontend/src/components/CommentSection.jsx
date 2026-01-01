import React, { useState, useEffect } from "react";
import {
  FaUserCircle,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaReply,
  FaThumbsUp,
  FaThumbsDown,
  FaEllipsisH,
  FaComments,
} from "react-icons/fa";
import { videoAPI } from "../services/api";
import "./CommentSection.css";

const CommentSection = ({ videoId, initialComments = [], onUpdate }) => {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [user, setUser] = useState(null);

  // Get current user
  useEffect(() => {
    const getUser = () => {
      try {
        const userData = localStorage.getItem("user");
        return userData ? JSON.parse(userData) : null;
      } catch (error) {
        console.error("Error getting user:", error);
        return null;
      }
    };
    setUser(getUser());
  }, []);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  // Handle add comment
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      setError("Please login to add a comment");
      setTimeout(() => {
        window.location.href = "/auth";
      }, 1500);
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

      if (response.data && response.data.comment) {
        const newCommentData = response.data.comment;
        setComments((prev) => [newCommentData, ...prev]);
        setNewComment("");
        setSuccess("Comment added successfully!");

        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (err) {
      console.error("❌ Error adding comment:", err);
      handleApiError(err, "Failed to add comment");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // Handle update comment
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

      if (response.data && response.data.comment) {
        setComments((prev) =>
          prev.map((comment) =>
            comment._id === commentId ? response.data.comment : comment
          )
        );
        setEditingComment(null);
        setEditText("");
        setSuccess("Comment updated successfully!");

        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (err) {
      console.error("❌ Error updating comment:", err);
      handleApiError(err, "Failed to update comment");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // Handle delete comment
  const handleDelete = async (commentId) => {
    if (!window.confirm("Are you sure you want to delete this comment?"))
      return;

    try {
      setLoading(true);
      setError("");

      await videoAPI.deleteComment(videoId, commentId);

      setComments((prev) =>
        prev.filter((comment) => comment._id !== commentId)
      );
      setSuccess("Comment deleted successfully!");

      if (onUpdate) {
        onUpdate();
      }
    } catch (err) {
      console.error("❌ Error deleting comment:", err);
      handleApiError(err, "Failed to delete comment");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // Handle reply to comment
  const handleReplySubmit = async (parentCommentId) => {
    if (!replyText.trim()) {
      setError("Reply cannot be empty");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Note: This assumes your backend supports replies
      // If not, you'll need to implement a reply system
      const response = await videoAPI.addComment(videoId, replyText);

      if (response.data && response.data.comment) {
        // Here you would typically add the reply to the parent comment
        // For now, we'll just add it as a regular comment
        const newReply = response.data.comment;
        setComments((prev) => [newReply, ...prev]);
        setReplyingTo(null);
        setReplyText("");
        setSuccess("Reply added successfully!");

        if (onUpdate) {
          onUpdate();
        }
      }
    } catch (err) {
      console.error("❌ Error adding reply:", err);
      handleApiError(err, "Failed to add reply");
    } finally {
      setLoading(false);
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  // Handle API errors
  const handleApiError = (err, defaultMessage) => {
    if (err.response?.status === 401) {
      setError("Your session has expired. Please login again.");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setTimeout(() => {
        window.location.href = "/auth";
      }, 2000);
    } else if (err.response?.status === 403) {
      setError("You are not authorized to perform this action");
    } else {
      setError(err.response?.data?.message || defaultMessage);
    }
    setTimeout(() => setError(""), 3000);
  };

  // Check if user owns the comment
  const isCommentOwner = (comment) => {
    if (!user || !comment) return false;

    const commentUserId = comment.userId?._id || comment.userId;
    const currentUserId = user._id;

    return (
      commentUserId &&
      currentUserId &&
      commentUserId.toString() === currentUserId.toString()
    );
  };

  // Format date
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

  // Get user avatar
  const getUserAvatar = (comment) => {
    if (comment.userId?.avatar) {
      return comment.userId.avatar;
    }
    if (user?.avatar) {
      return user.avatar;
    }
    return "https://cdn-icons-png.flaticon.com/512/149/149071.png";
  };

  // Get username
  const getUsername = (comment) => {
    if (comment.userId?.username) {
      return comment.userId.username;
    }
    if (user?.username) {
      return user.username;
    }
    return "Anonymous";
  };

  return (
    <div className="comment-section">
      {/* Header */}
      <div className="comment-section__header">
        <h3 className="comment-section__title">
          {comments.length} Comment{comments.length !== 1 ? "s" : ""}
        </h3>
        <div className="comment-section__sort">
          <select className="sort-select">
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="popular">Most popular</option>
          </select>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="comment-section__error">
          <span className="error-text">{error}</span>
        </div>
      )}
      {success && (
        <div className="comment-section__success">
          <span className="success-text">{success}</span>
        </div>
      )}

      {/* Comment Form */}
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
              disabled={loading || !user}
            />
            {!user && (
              <div className="login-prompt-small">
                Please <a href="/auth">login</a> to comment
              </div>
            )}
          </div>
        </div>
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
            disabled={!newComment.trim() || loading || !user}
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
      </form>

      {/* Comments List */}
      <div className="comment-section__list">
        {comments.length === 0 ? (
          <div className="no-comments">
            <FaComments size={40} color="#ccc" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          comments.map((comment) => {
            const commentId = comment._id;
            const isEditing = editingComment === commentId;
            const isReplying = replyingTo === commentId;
            const isOwner = isCommentOwner(comment);

            return (
              <div key={commentId} className="comment">
                {/* Comment Avatar */}
                <img
                  src={getUserAvatar(comment)}
                  alt={getUsername(comment)}
                  className="comment__avatar"
                  onError={(e) => {
                    e.target.src =
                      "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                  }}
                />

                {/* Comment Content */}
                <div className="comment__content">
                  {/* Comment Header */}
                  <div className="comment__header">
                    <div className="comment__author-info">
                      <span className="comment__author">
                        {getUsername(comment)}
                      </span>
                      <span className="comment__date">
                        {formatDate(comment.createdAt || comment.timestamp)}
                      </span>
                    </div>
                    <div className="comment__actions">
                      {isOwner && (
                        <>
                          <button
                            onClick={() => {
                              setEditingComment(commentId);
                              setEditText(comment.text);
                            }}
                            className="comment__action-btn"
                            title="Edit comment"
                            disabled={loading}
                          >
                            <FaEdit />
                          </button>
                          <button
                            onClick={() => handleDelete(commentId)}
                            className="comment__action-btn delete"
                            title="Delete comment"
                            disabled={loading}
                          >
                            <FaTrash />
                          </button>
                        </>
                      )}
                      <button
                        onClick={() =>
                          setReplyingTo(isReplying ? null : commentId)
                        }
                        className="comment__action-btn"
                        title="Reply to comment"
                        disabled={loading || !user}
                      >
                        <FaReply />
                      </button>
                    </div>
                  </div>

                  {/* Comment Body */}
                  {isEditing ? (
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
                          onClick={() => {
                            setEditingComment(null);
                            setEditText("");
                          }}
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

                      {/* Comment Reactions */}
                      <div className="comment__reactions">
                        <button
                          className="reaction-btn like"
                          title="Like comment"
                        >
                          <FaThumbsUp /> 0
                        </button>
                        <button
                          className="reaction-btn dislike"
                          title="Dislike comment"
                        >
                          <FaThumbsDown /> 0
                        </button>
                        <button
                          className="reaction-btn reply"
                          onClick={() =>
                            setReplyingTo(isReplying ? null : commentId)
                          }
                        >
                          Reply
                        </button>
                      </div>

                      {/* Reply Form */}
                      {isReplying && user && (
                        <div className="comment__reply-form">
                          <div className="reply-input-group">
                            <img
                              src={
                                user.avatar ||
                                "https://cdn-icons-png.flaticon.com/512/149/149071.png"
                              }
                              alt={user.username}
                              className="reply-avatar"
                            />
                            <div className="reply-input-wrapper">
                              <input
                                type="text"
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder={`Replying to ${getUsername(
                                  comment
                                )}...`}
                                className="reply-input"
                                disabled={loading}
                              />
                            </div>
                          </div>
                          <div className="reply-actions">
                            <button
                              type="button"
                              className="reply-cancel-btn"
                              onClick={() => {
                                setReplyingTo(null);
                                setReplyText("");
                              }}
                              disabled={loading}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="reply-submit-btn"
                              onClick={() => handleReplySubmit(commentId)}
                              disabled={!replyText.trim() || loading}
                            >
                              {loading ? (
                                <>
                                  <FaSpinner className="spinner" /> Posting...
                                </>
                              ) : (
                                "Reply"
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CommentSection;
