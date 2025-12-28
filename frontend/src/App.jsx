import React from "react";
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
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Header />
          <div className="app__body">
            <Sidebar />
            <div className="app__content">
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
                  {/* Catch all route - redirect to home */}
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
