import React, { useState, useEffect } from "react";
import VideoCard from "../components/VideoCard";
import FilterButtons from "../components/FilterButtons";
import { videoAPI } from "../services/api";
import "./Home.css";

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiDebug, setApiDebug] = useState("");

  const categories = [
    "All",
    "Music",
    "Sports",
    "Gaming",
    "Education",
    "Entertainment",
    "Technology",
  ];

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");
      setApiDebug("Fetching...");

      const params = new URLSearchParams(window.location.search);
      const searchParam = params.get("search") || "";
      const categoryParam = selectedCategory !== "All" ? selectedCategory : "";

      console.log("📡 API Call: GET /videos", { searchParam, categoryParam });

      const response = await videoAPI.getVideos(searchParam, categoryParam);

      // Debug logging
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
  };

  useEffect(() => {
    fetchVideos();

    // Listen for search updates
    const handleSearchUpdate = () => {
      fetchVideos();
    };

    window.addEventListener("searchUpdated", handleSearchUpdate);
    return () => {
      window.removeEventListener("searchUpdated", handleSearchUpdate);
    };
  }, [selectedCategory, window.location.search]);

  return (
    <div className="home">
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
              // Test API directly
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
