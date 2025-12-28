import axios from "axios";

const getApiUrl = () => {
  // In production (Vercel), we use relative URLs since frontend and backend are on same domain
  // In development, we use localhost
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://localhost:5001/api";
  } else {
    // In production, use relative URL (same domain)
    return "/api";
  }
};

const API_URL = getApiUrl();

console.log("🔧 API URL:", API_URL);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
  withCredentials: true,
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("🔑 Token added to request");
    } else {
      console.log("⚠️ No token found in localStorage");
    }
    return config;
  },
  (error) => {
    console.error("❌ Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    console.log(
      `✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${
        response.status
      }`
    );
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    console.error("❌ API Error:", {
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
      url: error.config?.url,
    });

    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear local storage and redirect
          console.warn("🔒 Unauthorized access. Redirecting to login...");
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          localStorage.removeItem("userChannel");
          if (window.location.pathname !== "/auth") {
            window.location.href = "/auth";
          }
          break;
        case 403:
          console.error("⛔ Forbidden access to resource");
          break;
        case 404:
          console.error("🔍 Resource not found");
          break;
        case 429:
          console.error("🚦 Too many requests. Please try again later.");
          break;
        case 500:
          console.error("💥 Server error. Please try again later.");
          break;
        default:
          console.error(
            `⚠️ API error ${error.response.status}:`,
            error.response.data
          );
      }
    } else if (error.request) {
      // Request made but no response
      console.error("🌐 Network error. Please check your internet connection.");
    } else {
      // Something else happened
      console.error("❌ Request setup error:", error.message);
    }

    return Promise.reject(error);
  }
);

// Test API connection
export const testAPI = async () => {
  try {
    const response = await api.get("/health");
    console.log("🔌 API Health Check:", response.data);
    return response.data.status === "OK";
  } catch (error) {
    console.error("🔌 API connection test failed:", error.message);
    return false;
  }
};

// Check if API is reachable
export const checkAPIStatus = async () => {
  try {
    await api.get("/test");
    return { connected: true, message: "API is connected" };
  } catch (error) {
    return {
      connected: false,
      message: error.message || "Cannot connect to API",
    };
  }
};

// Auth API
export const authAPI = {
  register: async (username, email, password) => {
    try {
      console.log("📝 Registering user:", email);
      const response = await api.post("/auth/register", {
        username,
        email,
        password,
      });
      console.log("✅ Registration successful");
      return response;
    } catch (error) {
      console.error(
        "❌ Registration failed:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  login: async (email, password) => {
    try {
      console.log("🔐 Logging in user:", email);
      const response = await api.post("/auth/login", {
        email,
        password,
      });
      console.log("✅ Login successful");
      return response;
    } catch (error) {
      console.error("❌ Login failed:", error.response?.data || error.message);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      console.log("👤 Fetching user profile");
      const response = await api.get("/auth/me");
      console.log("✅ Profile fetched successfully");
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch profile:", error.message);
      throw error;
    }
  },

  logout: () => {
    console.log("🚪 Logging out user");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userChannel");
    // Clear any other user-related data
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("user_") || key.startsWith("auth_")) {
        localStorage.removeItem(key);
      }
    });
  },
};

// Video API
export const videoAPI = {
  getVideos: async (search = "", category = "") => {
    try {
      console.log("🎬 Fetching videos:", { search, category });
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (category && category !== "All") params.append("category", category);

      const queryString = params.toString();
      const url = queryString ? `/videos?${queryString}` : "/videos";

      const response = await api.get(url);
      console.log(`✅ Fetched ${response.data?.length || 0} videos`);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch videos:", error.message);
      throw error;
    }
  },

  getVideo: async (id) => {
    try {
      console.log("🎥 Fetching video:", id);
      const response = await api.get(`/videos/${id}`);
      console.log("✅ Video fetched:", response.data?.title);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch video:", error.message);
      throw error;
    }
  },

  createVideo: async (videoData) => {
    try {
      console.log("📤 Creating video:", videoData.title);
      const response = await api.post("/videos", videoData);
      console.log("✅ Video created successfully");
      return response;
    } catch (error) {
      console.error(
        "❌ Failed to create video:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  updateVideo: async (id, videoData) => {
    try {
      console.log("✏️ Updating video:", id);
      const response = await api.put(`/videos/${id}`, videoData);
      console.log("✅ Video updated successfully");
      return response;
    } catch (error) {
      console.error("❌ Failed to update video:", error.message);
      throw error;
    }
  },

  deleteVideo: async (id) => {
    try {
      console.log("🗑️ Deleting video:", id);
      const response = await api.delete(`/videos/${id}`);
      console.log("✅ Video deleted successfully");
      return response;
    } catch (error) {
      console.error("❌ Failed to delete video:", error.message);
      throw error;
    }
  },

  likeVideo: async (id) => {
    try {
      console.log("👍 Liking video:", id);
      const response = await api.post(`/videos/${id}/like`);
      console.log("✅ Video liked");
      return response;
    } catch (error) {
      console.error("❌ Failed to like video:", error.message);
      throw error;
    }
  },

  dislikeVideo: async (id) => {
    try {
      console.log("👎 Disliking video:", id);
      const response = await api.post(`/videos/${id}/dislike`);
      console.log("✅ Video disliked");
      return response;
    } catch (error) {
      console.error("❌ Failed to dislike video:", error.message);
      throw error;
    }
  },

  addComment: async (videoId, text) => {
    try {
      console.log("💬 Adding comment to video:", videoId);
      const response = await api.post(`/videos/${videoId}/comments`, { text });
      console.log("✅ Comment added");
      return response;
    } catch (error) {
      console.error("❌ Failed to add comment:", error.message);
      throw error;
    }
  },

  updateComment: async (videoId, commentId, text) => {
    try {
      console.log("✏️ Updating comment:", commentId);
      const response = await api.put(
        `/videos/${videoId}/comments/${commentId}`,
        { text }
      );
      console.log("✅ Comment updated");
      return response;
    } catch (error) {
      console.error("❌ Failed to update comment:", error.message);
      throw error;
    }
  },

  deleteComment: async (videoId, commentId) => {
    try {
      console.log("🗑️ Deleting comment:", commentId);
      const response = await api.delete(
        `/videos/${videoId}/comments/${commentId}`
      );
      console.log("✅ Comment deleted");
      return response;
    } catch (error) {
      console.error("❌ Failed to delete comment:", error.message);
      throw error;
    }
  },
};

// Channel API
export const channelAPI = {
  createChannel: async (channelData) => {
    try {
      console.log("📡 Creating channel:", channelData.channelName);
      const response = await api.post("/channels", channelData);
      console.log("✅ Channel created:", response.data?.channel?.channelName);
      return response;
    } catch (error) {
      console.error(
        "❌ Failed to create channel:",
        error.response?.data || error.message
      );
      throw error;
    }
  },

  getChannel: async (id) => {
    try {
      console.log("📡 Fetching channel:", id);
      const response = await api.get(`/channels/${id}`);
      console.log("✅ Channel fetched:", response.data?.channelName);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch channel:", error.message);
      throw error;
    }
  },

  getMyChannel: async () => {
    try {
      console.log("📡 Fetching my channel");
      const response = await api.get("/channels/user/me");
      console.log("✅ My channel fetched:", response.data?.hasChannel);
      return response;
    } catch (error) {
      if (error.response?.status === 404) {
        console.log("ℹ️ User doesn't have a channel yet");
        throw error; // Re-throw so caller knows user has no channel
      }
      console.error("❌ Failed to fetch my channel:", error.message);
      throw error;
    }
  },

  checkChannel: async () => {
    try {
      console.log("🔍 Checking if user has a channel");
      const response = await api.get("/channels/check");
      console.log("✅ Channel check:", response.data?.hasChannel);
      return response;
    } catch (error) {
      console.error("❌ Failed to check channel:", error.message);
      throw error;
    }
  },

  getUserChannels: async (userId) => {
    try {
      console.log("📡 Fetching user channels:", userId);
      const response = await api.get(`/channels/user/${userId}`);
      console.log(`✅ Fetched ${response.data?.length || 0} channels`);
      return response;
    } catch (error) {
      console.error("❌ Failed to fetch user channels:", error.message);
      throw error;
    }
  },

  updateChannel: async (id, channelData) => {
    try {
      console.log("✏️ Updating channel:", id);
      const response = await api.put(`/channels/${id}`, channelData);
      console.log("✅ Channel updated");
      return response;
    } catch (error) {
      console.error("❌ Failed to update channel:", error.message);
      throw error;
    }
  },

  deleteChannel: async (id) => {
    try {
      console.log("🗑️ Deleting channel:", id);
      const response = await api.delete(`/channels/${id}`);
      console.log("✅ Channel deleted");
      return response;
    } catch (error) {
      console.error("❌ Failed to delete channel:", error.message);
      throw error;
    }
  },

  subscribe: async (channelId) => {
    try {
      console.log("🔔 Subscribing to channel:", channelId);
      const response = await api.post(`/channels/${channelId}/subscribe`);
      console.log("✅ Subscribed to channel");
      return response;
    } catch (error) {
      console.error("❌ Failed to subscribe:", error.message);
      throw error;
    }
  },

  unsubscribe: async (channelId) => {
    try {
      console.log("🔕 Unsubscribing from channel:", channelId);
      const response = await api.post(`/channels/${channelId}/unsubscribe`);
      console.log("✅ Unsubscribed from channel");
      return response;
    } catch (error) {
      console.error("❌ Failed to unsubscribe:", error.message);
      throw error;
    }
  },
};

// Helper function to get API status for debugging
export const getAPIConfig = () => {
  return {
    apiUrl: API_URL,
    hostname: window.location.hostname,
    protocol: window.location.protocol,
    port: window.location.port,
    token: localStorage.getItem("token") ? "Present" : "Missing",
    user: localStorage.getItem("user") ? "Present" : "Missing",
  };
};

export default api;
export { API_URL };
