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
import { testAPI } from "./services/api";
import "./App.css";

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState("checking");

  useEffect(() => {
    // Test API connection on app start
    const checkAPI = async () => {
      try {
        const isConnected = await testAPI();
        setApiStatus(isConnected ? "connected" : "disconnected");

        if (!isConnected) {
          console.warn(
            "⚠️ Backend API is not reachable. Some features may not work."
          );
        }
      } catch (error) {
        setApiStatus("error");
        console.error("❌ API check failed:", error);
      }
    };

    checkAPI();
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
      <Router>
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
              {showApiWarning && (
                <div className="api-warning">
                  <p>
                    ⚠️ Backend connection: {apiStatus}.
                    {apiStatus === "checking" && " Checking..."}
                    {apiStatus === "disconnected" &&
                      " Please ensure backend server is running on port 5001"}
                    {apiStatus === "error" &&
                      " Connection error. Check console for details."}
                  </p>
                </div>
              )}
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
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </ErrorBoundary>
            </div>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
