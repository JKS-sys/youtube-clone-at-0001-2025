import axios from "axios";

// Get current hostname and protocol
const getBaseURL = () => {
  const hostname = window.location.hostname;
  const port = window.location.port;

  // For development (localhost)
  if (hostname === "localhost" || hostname === "127.0.0.1") {
    return `http://localhost:${port === "3000" ? "5001" : port || "5001"}/api`;
  }

  // For Vercel/Production - use relative URL
  return "/api";
};

// Create axios instance
const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
API.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error("API Error:", {
      url: error.config?.url,
      status: error.response?.status,
      data: error.response?.data,
    });

    if (error.response?.status === 401) {
      // Clear invalid auth data
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("storage"));

      // Redirect to login if not already there
      if (!window.location.pathname.includes("/auth")) {
        window.location.href = "/auth";
      }
    }

    return Promise.reject(error);
  }
);

// Test API connection
export const testAPI = async () => {
  try {
    const response = await API.get("/health");
    console.log("✅ API Connection Test:", response.data);
    return true;
  } catch (error) {
    console.error("❌ API Connection Failed:", error.message);
    return false;
  }
};

// Video API endpoints
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
  updateChannel: (id, channelData) => API.put(`/channels/${id}`, channelData),
  deleteChannel: (id) => API.delete(`/channels/${id}`),
  getUserChannels: (userId) => API.get(`/channels/user/${userId}`),
};

export default API;
