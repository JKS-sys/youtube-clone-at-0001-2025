// frontend/src/services/api.js
import axios from "axios";

// Use absolute URL for development, relative for production
const getBaseURL = () => {
  // If we're on localhost, use the full URL
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5001/api";
  }

  // For Vercel deployment - use relative path
  return "/api";
};

console.log("🔧 API Base URL:", getBaseURL());

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// **FIX 1: Better request interceptor**
API.interceptors.request.use(
  (config) => {
    // Get token from localStorage (not from context)
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log(
        `🔐 Token attached to ${config.method?.toUpperCase()} ${config.url}`
      );
    } else {
      console.warn(
        `⚠️ No token found for ${config.method?.toUpperCase()} ${config.url}`
      );
    }

    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// **FIX 2: Better response interceptor**
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("❌ API Error:", {
      status: error.response?.status,
      url: error.config?.url,
      message: error.message,
    });

    // Handle 401 Unauthorized
    if (error.response?.status === 401) {
      console.log("🔐 401 Unauthorized - Clearing auth data");

      // Clear invalid auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if not already on auth page
      if (!window.location.pathname.includes("/auth")) {
        console.log("Redirecting to login...");
        // We'll handle redirect in components, not here
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

    return API.get("/videos", { params });
  },

  getVideo: (id) => API.get(`/videos/${id}`),

  createVideo: (videoData) => API.post("/videos", videoData),

  updateVideo: (id, videoData) => API.put(`/videos/${id}`, videoData),

  deleteVideo: (id) => API.delete(`/videos/${id}`),

  likeVideo: (id) => {
    console.log(`👍 Liking video ${id}`);
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No token available for like request");
      return Promise.reject(new Error("No authentication token"));
    }
    return API.post(`/videos/${id}/like`);
  },

  dislikeVideo: (id) => {
    console.log(`👎 Disliking video ${id}`);
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No token available for dislike request");
      return Promise.reject(new Error("No authentication token"));
    }
    return API.post(`/videos/${id}/dislike`);
  },

  addComment: (videoId, text) => {
    console.log(`💬 Adding comment to video ${videoId}`);
    const token = localStorage.getItem("token");
    if (!token) {
      console.error("❌ No token available for comment request");
      return Promise.reject(new Error("No authentication token"));
    }
    return API.post(`/videos/${videoId}/comments`, { text });
  },

  updateComment: (videoId, commentId, text) =>
    API.put(`/videos/${videoId}/comments/${commentId}`, { text }),

  deleteComment: (videoId, commentId) =>
    API.delete(`/videos/${videoId}/comments/${commentId}`),
};

// Auth API functions
export const authAPI = {
  login: (email, password) => API.post("/auth/login", { email, password }),

  register: (username, email, password) =>
    API.post("/auth/register", { username, email, password }),

  getMe: () => {
    const token = localStorage.getItem("token");
    if (!token) {
      return Promise.reject(new Error("No token"));
    }
    return API.get("/auth/me");
  },
};

// Channel API functions
export const channelAPI = {
  createChannel: (channelData) => API.post("/channels", channelData),

  getChannel: (id) => API.get(`/channels/${id}`),

  getUserChannels: (userId) => API.get(`/channels/user/${userId}`),

  updateChannel: (id, channelData) => API.put(`/channels/${id}`, channelData),

  deleteChannel: (id) => API.delete(`/channels/${id}`),
};

export default API;
