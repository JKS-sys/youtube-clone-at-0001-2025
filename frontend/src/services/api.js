import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5001/api",
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Video API functions
export const videoAPI = {
  getVideos: (search = "", category = "All") =>
    API.get("/videos", { params: { search, category } }),
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
