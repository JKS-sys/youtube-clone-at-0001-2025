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

  const categories = [
    "All",
    "Music",
    "Sports",
    "Gaming",
    "Education",
    "Entertainment",
    "Technology",
  ];

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        setLoading(true);
        setError("");
        const params = new URLSearchParams(window.location.search);
        const searchParam = params.get("search") || "";
        const categoryParam =
          selectedCategory !== "All" ? selectedCategory : "";

        console.log("Fetching videos with params:", {
          searchParam,
          categoryParam,
        });

        const response = await videoAPI.getVideos(searchParam, categoryParam);
        console.log("API Response:", response);

        // Ensure response.data is an array
        if (response && response.data) {
          if (Array.isArray(response.data)) {
            setVideos(response.data);
          } else if (
            response.data.videos &&
            Array.isArray(response.data.videos)
          ) {
            // Handle case where data is wrapped in an object
            setVideos(response.data.videos);
          } else if (typeof response.data === "object") {
            // If it's a single object, wrap it in an array
            setVideos([response.data]);
          } else {
            console.warn("Unexpected response format:", response.data);
            setVideos([]);
          }
        } else {
          console.warn("No data in response:", response);
          setVideos([]);
        }
      } catch (err) {
        console.error("Error fetching videos:", err);
        setError("Failed to load videos. Please try again.");
        setVideos([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();

    // Listen for search updates from header
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
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      ) : videos.length === 0 ? (
        <div className="no-videos">
          <p>No videos found. Try a different search or category.</p>
        </div>
      ) : (
        <div className="home__videos">
          {videos.map((video) => (
            <VideoCard key={video._id || video.id} video={video} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Home;
