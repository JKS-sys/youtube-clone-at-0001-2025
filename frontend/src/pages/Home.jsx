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
        const params = new URLSearchParams(window.location.search);
        const searchParam = params.get("search") || "";
        const categoryParam =
          selectedCategory !== "All" ? selectedCategory : "";

        const response = await videoAPI.getVideos(searchParam, categoryParam);
        setVideos(response.data);
      } catch (error) {
        console.error("Error fetching videos:", error);
        setError("Failed to load videos. Please try again.");
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
    return () =>
      window.removeEventListener("searchUpdated", handleSearchUpdate);
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
      ) : videos.length === 0 ? (
        <div className="no-videos">
          <p>No videos found</p>
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
