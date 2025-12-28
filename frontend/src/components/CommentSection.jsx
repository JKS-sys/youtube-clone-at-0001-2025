import React, { useState, useEffect } from "react";
import {
  FaUserCircle,
  FaEdit,
  FaTrash,
  FaReply,
  FaCheck,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { videoAPI } from "../services/api";
import "./CommentSection.css";

const CommentSection = ({ videoId, initialComments = [], onUpdate }) => {
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [editingComment, setEditingComment] = useState(null);
  const [editText, setEditText] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || !user) return;

    try {
      setLoading(true);
      const response = await videoAPI.addComment(videoId, newComment);

      // Add the new comment to the list
      setComments((prev) => [...prev, response.data]);
      setNewComment("");

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Failed to add comment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (comment) => {
    setEditingComment(comment._id);
    setEditText(comment.text);
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
      alert("Failed to update comment. Please try again.");
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
      alert("Failed to delete comment. Please try again.");
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
      {user ? (
        <form onSubmit={handleSubmit} className="comment-section__form">
          <div className="comment-section__input-group">
            <img
              src={user.avatar}
              alt={user.username}
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
                        onClick={() => handleEdit(comment)}
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
