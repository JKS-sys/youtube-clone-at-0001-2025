// frontend/src/services/api.js
import axios from "axios";

// Determine API URL based on environment
const getBaseURL = () => {
  // Local development
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5001/api";
  }

  // Production on Vercel - use relative path
  return "/api";
};

console.log("🔧 API Base URL:", getBaseURL());
console.log("🔧 Current host:", window.location.hostname);

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error("❌ Request error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    // Check if we got HTML instead of JSON (routing error)
    if (
      typeof response.data === "string" &&
      response.data.includes("<!DOCTYPE html>")
    ) {
      console.error("❌ API ROUTING ERROR: Got HTML instead of JSON");
      console.error("This means Vercel is not routing /api/* to backend");
      throw new Error(
        "API routing misconfigured. Check vercel.json and api/index.js"
      );
    }
    return response;
  },
  (error) => {
    console.error("❌ API Error Details:", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message,
    });

    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }

    return Promise.reject(error);
  }
);

// Video API
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

  likeVideo: (id) => API.post(`/videos/${id}/like`),

  dislikeVideo: (id) => API.post(`/videos/${id}/dislike`),

  addComment: (videoId, text) =>
    API.post(`/videos/${videoId}/comments`, { text }),

  updateComment: (videoId, commentId, text) =>
    API.put(`/videos/${videoId}/comments/${commentId}`, { text }),

  deleteComment: (videoId, commentId) =>
    API.delete(`/videos/${videoId}/comments/${commentId}`),
};

// Auth API
export const authAPI = {
  login: (email, password) => API.post("/auth/login", { email, password }),

  register: (username, email, password) =>
    API.post("/auth/register", { username, email, password }),

  getMe: () => API.get("/auth/me"),
};

// Channel API
export const channelAPI = {
  createChannel: (channelData) => API.post("/channels", channelData),

  getChannel: (id) => API.get(`/channels/${id}`),

  getUserChannels: (userId) => API.get(`/channels/user/${userId}`),

  updateChannel: (id, channelData) => API.put(`/channels/${id}`, channelData),

  deleteChannel: (id) => API.delete(`/channels/${id}`),
};

export default API;
