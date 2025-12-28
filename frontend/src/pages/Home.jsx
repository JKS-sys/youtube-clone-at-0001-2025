import React, { useState, useEffect, useCallback } from "react";
import VideoCard from "../components/VideoCard";
import FilterButtons from "../components/FilterButtons";
import { videoAPI } from "../services/api";
import "./Home.css";

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiDebug, setApiDebug] = useState("");
  const [channels, setChannels] = useState([]);
  const [channelsLoading, setChannelsLoading] = useState(false);

  const categories = [
    "All",
    "Music",
    "Sports",
    "Gaming",
    "Education",
    "Entertainment",
    "Technology",
  ];

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      setApiDebug("Fetching...");

      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get("search") || "";
      const categoryParam = selectedCategory !== "All" ? selectedCategory : "";

      console.log("📡 API Call: GET /videos", { searchParam, categoryParam });

      const response = await videoAPI.getVideos(searchParam, categoryParam);

      console.log("📦 API Response:", {
        status: response.status,
        dataType: typeof response.data,
        isArray: Array.isArray(response.data),
        data: response.data,
      });

      setApiDebug(
        `API Status: ${response.status}, Data Type: ${typeof response.data}`
      );

      if (response.data && Array.isArray(response.data)) {
        setVideos(response.data);
      } else {
        console.error("❌ Invalid response format:", response.data);
        setError("Invalid response from server. Check API configuration.");
      }
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(`Failed to load videos: ${err.message}`);
      setApiDebug(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  const fetchAllChannels = async () => {
    try {
      setChannelsLoading(true);
      const response = await fetch("/api/channels");
      const data = await response.json();
      setChannels(data);
      localStorage.setItem("allChannels", JSON.stringify(data));
    } catch (error) {
      console.error("Error fetching channels:", error);
    } finally {
      setChannelsLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Separate effect for channels (optional - remove if not needed)
  useEffect(() => {
    // Only fetch channels if you need them for debugging
    // fetchAllChannels();
  }, []);

  // If you want to keep the channels debug panel, use this instead:
  const ChannelDebugPanel = () => (
    <div
      style={{ padding: "20px", background: "#f5f5f5", marginBottom: "20px" }}
    >
      <h2>All Channels Debug</h2>
      <button onClick={fetchAllChannels} disabled={channelsLoading}>
        {channelsLoading ? "Loading..." : "Refresh Channels"}
      </button>
      <div style={{ marginTop: "20px" }}>
        {channels.map((channel) => (
          <div
            key={channel._id}
            style={{
              padding: "10px",
              margin: "10px 0",
              border: "1px solid #ddd",
              borderRadius: "5px",
              background: "white",
            }}
          >
            <h3>{channel.channelName}</h3>
            <p>ID: {channel._id}</p>
            <p>Owner: {channel.owner?.username || channel.owner}</p>
            <p>Videos: {channel.videos?.length || 0}</p>
            <button
              onClick={() => (window.location.href = `/channel/${channel._id}`)}
            >
              View Channel
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="home">
      {/* Remove the ChannelDebugPanel in production */}
      {/* <ChannelDebugPanel /> */}

      {/* Debug Info (remove in production) */}
      <div
        style={{
          padding: "10px",
          margin: "10px",
          background: "#f0f0f0",
          borderRadius: "5px",
          fontSize: "12px",
          fontFamily: "monospace",
        }}
      >
        <strong>Debug Info:</strong> {apiDebug}
      </div>

      <FilterButtons
        categories={categories}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
      />

      {loading ? (
        <div className="loading">
          <p>Loading videos...</p>
        </div>
      ) : error ? (
        <div className="error">
          <p>{error}</p>
          <button onClick={() => fetchVideos()}>Retry</button>
          <button
            onClick={() => {
              fetch("/api/health")
                .then((res) => res.json())
                .then((data) => console.log("Health:", data))
                .catch((err) => console.error("Health error:", err));
            }}
          >
            Test API Health
          </button>
        </div>
      ) : videos.length === 0 ? (
        <div className="no-videos">
          <p>No videos found. Try a different search or category.</p>
        </div>
      ) : (
        <div className="home__videos">
          {videos.map((video) => (
            <VideoCard key={video._id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
