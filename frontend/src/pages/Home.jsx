import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { videoAPI } from "../services/api";
import VideoCard from "../components/VideoCard";
import {
  FaFire,
  FaFilter,
  FaSyncAlt,
  FaVideo,
  FaYoutube,
  FaEye,
  FaUser,
  FaExclamationTriangle,
} from "react-icons/fa";
import "./Home.css";

const Home = () => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [category, setCategory] = useState("All");
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const categories = [
    "All",
    "Education",
    "Entertainment",
    "Music",
    "Gaming",
    "Sports",
    "Technology",
    "Lifestyle",
    "News",
    "Other",
  ];

  const fetchVideos = async () => {
    try {
      setLoading(true);
      setError("");
      setRefreshing(true);

      const searchParam = searchParams.get("search") || "";
      const categoryParam = searchParams.get("category") || "";

      console.log("📡 Fetching videos...");

      const response = await videoAPI.getVideos(searchParam, categoryParam);

      console.log("📦 API Response:", response.data);

      // Handle different response structures
      let videoArray = [];

      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        videoArray = response.data;
        console.log(`✅ Direct array response: ${videoArray.length} videos`);
      }
      // Check if response.data has a videos property
      else if (
        response.data &&
        response.data.videos &&
        Array.isArray(response.data.videos)
      ) {
        videoArray = response.data.videos;
        console.log(`✅ Object with videos array: ${videoArray.length} videos`);
      }
      // Check if response.data is an object with success property
      else if (
        response.data &&
        response.data.success &&
        Array.isArray(response.data.videos)
      ) {
        videoArray = response.data.videos;
        console.log(
          `✅ Success object with videos: ${videoArray.length} videos`
        );
      }
      // Check if response.data is an object with data property
      else if (
        response.data &&
        response.data.data &&
        Array.isArray(response.data.data)
      ) {
        videoArray = response.data.data;
        console.log(`✅ Object with data array: ${videoArray.length} videos`);
      } else {
        console.warn("⚠️ Unexpected response structure:", response.data);
        videoArray = [];
      }

      // Process videos to ensure proper channel information
      const processedVideos = videoArray.map((video) => {
        // Create a clean video object
        const processedVideo = { ...video };

        // Ensure channelId is properly set
        if (!processedVideo.channelId && processedVideo.channel) {
          processedVideo.channelId = processedVideo.channel;
        }

        // Ensure uploader information is included
        if (!processedVideo.uploader && processedVideo.user) {
          processedVideo.uploader = processedVideo.user;
        }

        // Ensure required fields have defaults
        if (!processedVideo.thumbnailUrl) {
          processedVideo.thumbnailUrl =
            "https://via.placeholder.com/320x180?text=No+Thumbnail";
        }

        if (!processedVideo.title) {
          processedVideo.title = "Untitled Video";
        }

        return processedVideo;
      });

      if (processedVideos && processedVideos.length > 0) {
        setVideos(processedVideos);
        console.log(`✅ Set ${processedVideos.length} videos to state`);
      } else {
        setVideos([]);
        console.log("ℹ️ No videos found in response");
      }
    } catch (error) {
      console.error("❌ Error fetching videos:", error);
      setError(
        error.message || "Failed to load videos. Please check your connection."
      );
      setVideos([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVideos();

    // Update search state from URL
    const searchParam = searchParams.get("search") || "";
    const categoryParam = searchParams.get("category") || "All";

    setCategory(categoryParam);
  }, [searchParams]);

  const handleCategoryChange = (cat) => {
    setCategory(cat);
    const params = new URLSearchParams();
    const searchParam = searchParams.get("search") || "";
    if (searchParam) params.append("search", searchParam);
    if (cat && cat !== "All") params.append("category", cat);

    setSearchParams(params);
    fetchVideos();
  };

  const handleRefresh = () => {
    fetchVideos();
  };

  const handleClearFilters = () => {
    setCategory("All");
    setSearchParams({});
    fetchVideos();
  };

  if (loading && !refreshing) {
    return (
      <div className="home-loading">
        <div className="spinner-container">
          <div className="spinner"></div>
          <p>Loading videos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home">
      {/* Hero Section - Removed the search bar from here */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Welcome to YouTube Clone</h1>
          <p>Watch, share, and discover amazing videos</p>
          <div className="hero-buttons">
            <button
              onClick={() => {
                setCategory("All");
                setSearchParams({});
                fetchVideos();
              }}
              className="hero-btn"
            >
              Explore All Videos
            </button>
            <button
              onClick={() => (window.location.href = "/create-channel")}
              className="hero-btn secondary"
            >
              Create Your Channel
            </button>
          </div>
        </div>
      </div>

      {/* Categories Section */}
      <div className="categories-section">
        <div className="categories-header">
          <div className="categories-title">
            <FaFilter />
            <h3>Categories</h3>
            <button
              onClick={handleRefresh}
              className="refresh-button"
              disabled={refreshing}
            >
              <FaSyncAlt className={refreshing ? "spinning" : ""} />
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          {searchParams.get("search") && (
            <div className="active-search">
              <span>Showing results for: "{searchParams.get("search")}"</span>
              <button onClick={handleClearFilters} className="clear-search">
                Clear All Filters
              </button>
            </div>
          )}
        </div>

        <div className="category-buttons">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`category-btn ${category === cat ? "active" : ""}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Videos Section */}
      <div className="videos-section">
        <div className="section-header">
          <h2>
            <FaFire />{" "}
            {searchParams.get("search")
              ? `Search Results (${videos.length})`
              : category === "All"
              ? "Recommended Videos"
              : `${category} Videos`}
            <span className="video-count"> ({videos.length})</span>
          </h2>

          {videos.length === 0 && !error && !loading && (
            <button onClick={handleRefresh} className="btn btn-primary btn-sm">
              <FaSyncAlt /> Load Videos
            </button>
          )}
        </div>

        {error ? (
          <div className="error-message">
            <FaExclamationTriangle size={40} />
            <h3>Unable to Load Videos</h3>
            <p>{error}</p>
            <div className="error-actions">
              <button onClick={handleRefresh} className="btn btn-primary">
                Try Again
              </button>
              <button
                onClick={handleClearFilters}
                className="btn btn-secondary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        ) : videos.length === 0 ? (
          <div className="no-videos">
            <div className="no-videos-content">
              <FaVideo size={60} />
              <h3>No videos found</h3>
              <p>Try changing your search or filter criteria</p>
              <div className="no-videos-actions">
                <button
                  onClick={handleClearFilters}
                  className="btn btn-primary"
                >
                  Clear All Filters
                </button>
                <button onClick={handleRefresh} className="btn btn-secondary">
                  Refresh
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="videos-grid">
              {videos.map((video) => (
                <div
                  key={video._id || `video-${Math.random()}`}
                  className="video-card-wrapper"
                >
                  <VideoCard video={video} />
                </div>
              ))}
            </div>

            {/* Load More Button */}
            {videos.length > 0 && (
              <div className="load-more">
                <button onClick={handleRefresh} className="btn btn-outline">
                  <FaSyncAlt /> Load More Videos
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Stats Section */}
      {videos.length > 0 && (
        <div className="stats-section">
          <div className="stat-card">
            <FaVideo />
            <div className="stat-info">
              <h3>{videos.length}</h3>
              <p>Total Videos</p>
            </div>
          </div>
          <div className="stat-card">
            <FaUser />
            <div className="stat-info">
              <h3>
                {
                  new Set(
                    videos
                      .map(
                        (v) =>
                          v.channelId?._id || v.channelId || v.uploader?._id
                      )
                      .filter(Boolean)
                  ).size
                }
              </h3>
              <p>Unique Channels</p>
            </div>
          </div>
          <div className="stat-card">
            <FaEye />
            <div className="stat-info">
              <h3>
                {videos
                  .reduce((total, video) => total + (video.views || 0), 0)
                  .toLocaleString()}
              </h3>
              <p>Total Views</p>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action */}
      <div className="cta-section">
        <div className="cta-content">
          <FaYoutube size={50} color="#FF0000" />
          <h3>Ready to share your content?</h3>
          <p>Create your own channel and start uploading videos today!</p>
          <button
            onClick={() => (window.location.href = "/create-channel")}
            className="cta-btn"
          >
            Create Your Channel
          </button>
        </div>
      </div>
    </div>
  );
};

export default Home;
