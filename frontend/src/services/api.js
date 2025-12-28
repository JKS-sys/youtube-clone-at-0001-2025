// frontend/src/services/api.js
import axios from "axios";

const getBaseURL = () => {
  // Check environment
  if (
    process.env.NODE_ENV === "development" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5001/api";
  }

  // For Vercel deployment - you need to update this with your actual backend URL
  if (window.location.hostname.includes("vercel.app")) {
    // If your backend is deployed separately, put that URL here
    // Example: return "https://your-backend-api.vercel.app/api";
    return "/api"; // This assumes your backend routes are proxied
  }

  // Fallback
  return "http://localhost:5001/api";
};

// Create axios instance
const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor - adds token to EVERY request
API.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Debug logging
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    if (token) {
      console.log(`Token attached: ${token.substring(0, 20)}...`);
    }

    return config;
  },
  (error) => {
    console.error("Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor - handles errors globally
API.interceptors.response.use(
  (response) => {
    console.log(
      `API Response Success: ${response.status} ${response.config.url}`
    );
    return response;
  },
  (error) => {
    console.error("API Response Error:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log("Unauthorized access detected");

      // Clear invalid auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Dispatch event for components to react
      window.dispatchEvent(new Event("unauthorized"));

      // Show message if we're in browser context
      if (
        typeof window !== "undefined" &&
        !window.location.pathname.includes("/auth")
      ) {
        console.log("Redirecting to login...");
        // Don't redirect automatically - let components handle it
      }
    }

    return Promise.reject(error);
  }
);

// Video API functions
export const videoAPI = {
  getVideos: (search = "", category = "") => {
    const params = {};
    if (search) params.search = search;
    if (category && category !== "All") params.category = category;

    console.log("Fetching videos with params:", params);
    return API.get("/videos", { params });
  },

  getVideo: (id) => {
    console.log("Fetching video:", id);
    return API.get(`/videos/${id}`);
  },

  createVideo: (videoData) => {
    console.log("Creating video:", videoData.title);
    return API.post("/videos", videoData);
  },

  updateVideo: (id, videoData) => {
    console.log("Updating video:", id);
    return API.put(`/videos/${id}`, videoData);
  },

  deleteVideo: (id) => {
    console.log("Deleting video:", id);
    return API.delete(`/videos/${id}`);
  },

  likeVideo: (id) => {
    console.log("Liking video:", id);
    return API.post(`/videos/${id}/like`);
  },

  dislikeVideo: (id) => {
    console.log("Disliking video:", id);
    return API.post(`/videos/${id}/dislike`);
  },

  addComment: (videoId, text) => {
    console.log("Adding comment to video:", videoId);
    return API.post(`/videos/${videoId}/comments`, { text });
  },

  updateComment: (videoId, commentId, text) => {
    console.log("Updating comment:", commentId);
    return API.put(`/videos/${videoId}/comments/${commentId}`, { text });
  },

  deleteComment: (videoId, commentId) => {
    console.log("Deleting comment:", commentId);
    return API.delete(`/videos/${videoId}/comments/${commentId}`);
  },
};

// Auth API functions
export const authAPI = {
  login: (email, password) => {
    console.log("Login attempt for:", email);
    return API.post("/auth/login", { email, password });
  },

  register: (username, email, password) => {
    console.log("Register attempt for:", username, email);
    return API.post("/auth/register", { username, email, password });
  },

  getMe: () => {
    console.log("Getting current user");
    return API.get("/auth/me");
  },
};

// Channel API functions
export const channelAPI = {
  createChannel: (channelData) => {
    console.log("Creating channel:", channelData.channelName);
    return API.post("/channels", channelData);
  },

  getChannel: (id) => {
    console.log("Getting channel:", id);
    return API.get(`/channels/${id}`);
  },

  getUserChannels: (userId) => {
    console.log("Getting user channels for:", userId);
    return API.get(`/channels/user/${userId}`);
  },

  updateChannel: (id, channelData) => {
    console.log("Updating channel:", id);
    return API.put(`/channels/${id}`, channelData);
  },

  deleteChannel: (id) => {
    console.log("Deleting channel:", id);
    return API.delete(`/channels/${id}`);
  },
};

export default API;
