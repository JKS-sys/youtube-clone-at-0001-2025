import axios from "axios";

// API URL configuration
const getApiUrl = () => {
  // For development
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5001/api";
  }
  // For production
  return "/api";
};

const API_URL = getApiUrl();

console.log(`🌐 Using API URL: ${API_URL}`);

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

// Request interceptor to add auth token
api.interceptors.request.use(
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
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("API Error:", error.response?.data || error.message);

    // Handle authentication errors
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/auth";
    }

    return Promise.reject(error);
  }
);

// Test API connection
export const testAPI = async () => {
  try {
    const response = await api.get("/health");
    return response.data.status === "OK";
  } catch (error) {
    console.error("API test failed:", error.message);
    return false;
  }
};

// Auth API
export const authAPI = {
  register: (username, email, password) =>
    api.post("/auth/register", { username, email, password }),

  login: (email, password) => api.post("/auth/login", { email, password }),

  getProfile: () => api.get("/auth/me"),

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

// Video API
export const videoAPI = {
  getVideos: (search = "", category = "", channelId = "") => {
    const params = {};
    if (search) params.search = search;
    if (category && category !== "All") params.category = category;
    if (channelId) params.channelId = channelId;

    return api.get("/videos", { params });
  },

  getVideo: (id) => api.get(`/videos/${id}`),

  createVideo: (videoData) => api.post("/videos", videoData),

  updateVideo: (id, videoData) => api.put(`/videos/${id}`, videoData),

  deleteVideo: (id) => api.delete(`/videos/${id}`),

  likeVideo: (id) => api.post(`/videos/${id}/like`),

  dislikeVideo: (id) => api.post(`/videos/${id}/dislike`),

  addComment: (videoId, text) =>
    api.post(`/videos/${videoId}/comments`, { text }),

  updateComment: (videoId, commentId, text) =>
    api.put(`/videos/${videoId}/comments/${commentId}`, { text }),

  deleteComment: (videoId, commentId) =>
    api.delete(`/videos/${videoId}/comments/${commentId}`),
};

// Channel API
export const channelAPI = {
  getChannels: (search = "", limit = 20) => {
    const params = { limit };
    if (search) params.search = search;
    return api.get("/channels", { params });
  },

  getChannel: (id) => api.get(`/channels/${id}`),

  getMyChannel: () => api.get("/channels/user/me"),

  createChannel: (channelData) => api.post("/channels", channelData),

  updateChannel: (id, channelData) => api.put(`/channels/${id}`, channelData),

  deleteChannel: (id) => api.delete(`/channels/${id}`),

  subscribe: (channelId) => api.post(`/channels/${channelId}/subscribe`),

  unsubscribe: (channelId) => api.delete(`/channels/${channelId}/subscribe`),
};

export default api;
