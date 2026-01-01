import React, { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Header from "./components/Header";
import Sidebar from "./components/Sidebar";
import Home from "./pages/Home";
import VideoPlayer from "./pages/VideoPlayer";
import Channel from "./pages/Channel";
import CreateChannel from "./pages/CreateChannel";
import Auth from "./pages/Auth";
import Placeholder from "./pages/Placeholder";
import ErrorBoundary from "./components/ErrorBoundary";
import ManageChannel from "./pages/ManageChannel";
import { testAPI } from "./services/api";
import "./App.css";

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking");
  const [apiUrl, setApiUrl] = useState("");

  useEffect(() => {
    // Test API connection on app start
    const checkAPI = async () => {
      try {
        console.log("🔗 Testing API connection...");
        const isConnected = await testAPI();
        setApiStatus(isConnected ? "connected" : "disconnected");

        if (!isConnected) {
          console.warn(
            "⚠️ Backend API is not reachable. Some features may not work."
          );
        }
      } catch (error) {
        console.error("❌ API check failed:", error);
        setApiStatus("error");
      }
    };

    // Get API URL from environment
    const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
    setApiUrl(apiUrl);
    console.log(`🌐 Using API URL: ${apiUrl}`);

    checkAPI();

    // Check API connection every 30 seconds
    const interval = setInterval(checkAPI, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleMenuClick = () => {
    if (window.innerWidth <= 768) {
      setMobileMenuOpen(!mobileMenuOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  // Show API status warning
  const showApiWarning = apiStatus !== "connected";

  return (
    <AuthProvider>
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app">
          <Header onMenuClick={handleMenuClick} />
          <div className="app__body">
            <Sidebar
              isCollapsed={sidebarCollapsed}
              mobileMenuOpen={mobileMenuOpen}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onCloseMobileMenu={closeMobileMenu}
            />
            <div className="app__content">
              {/* Demo Notice */}
              <div className="demo-notice">
                <p>
                  🚀 <strong>YouTube Clone Demo</strong> | This is a fully
                  functional YouTube clone with real features.
                  {showApiWarning && (
                    <span style={{ color: "#ff0000", marginLeft: "10px" }}>
                      ⚠️ Backend: {apiStatus} | Using API: {apiUrl}
                    </span>
                  )}
                </p>
              </div>

              <ErrorBoundary>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/video/:id" element={<VideoPlayer />} />
                  <Route path="/channel/:id" element={<Channel />} />
                  <Route path="/create-channel" element={<CreateChannel />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route
                    path="/trending"
                    element={<Placeholder pageName="Trending" />}
                  />
                  <Route
                    path="/subscriptions"
                    element={<Placeholder pageName="Subscriptions" />}
                  />
                  <Route
                    path="/library"
                    element={<Placeholder pageName="Library" />}
                  />
                  <Route
                    path="/history"
                    element={<Placeholder pageName="History" />}
                  />
                  <Route
                    path="/your-videos"
                    element={<Placeholder pageName="Your Videos" />}
                  />
                  <Route
                    path="/liked-videos"
                    element={<Placeholder pageName="Liked Videos" />}
                  />
                  <Route path="/manage-channel" element={<ManageChannel />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>

              {/* Footer */}
              <footer className="app-footer">
                <p>
                  © 2024 YouTube Clone. Built with React, Node.js, and MongoDB.
                </p>
                <p className="footer-links">
                  <a
                    href="https://github.com/yourusername/youtube-clone"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    GitHub
                  </a>
                  <span> • </span>
                  <a href="/api" target="_blank">
                    API Documentation
                  </a>
                  <span> • </span>
                  <a href="/api/health" target="_blank">
                    API Health
                  </a>
                </p>
              </footer>
            </div>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
