import axios from "axios";

const getBaseURL = () => {
  // Check if we're in development
  if (
    process.env.NODE_ENV === "development" ||
    window.location.hostname === "localhost"
  ) {
    return "http://localhost:5001/api";
  }

  // For production on Vercel
  if (window.location.hostname.includes("vercel.app")) {
    // Try to use relative path first
    return "/api";
  }

  // Fallback
  return "http://localhost:5001/api";
};

const API = axios.create({
  baseURL: getBaseURL(),
  timeout: 15000, // Increased timeout
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
    console.log("API Request:", config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
API.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error(
      "API Response Error:",
      error.response?.status,
      error.config?.url
    );

    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new Event("unauthorized"));
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
  likeVideo: (id) => API.post(`/videos/${id}/like`),
  dislikeVideo: (id) => API.post(`/videos/${id}/dislike`),
  addComment: (videoId, text) =>
    API.post(`/videos/${videoId}/comments`, { text }),
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
  getMe: () => API.get("/auth/me"),
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
