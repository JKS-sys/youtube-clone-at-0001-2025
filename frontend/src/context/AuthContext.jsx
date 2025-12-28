// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Function to validate and set token
  const setAuthToken = (token) => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    } else {
      delete axios.defaults.headers.common["Authorization"];
    }
  };

  // Function to verify token and get user data
  const verifyAndSetUser = async (token) => {
    try {
      setAuthToken(token);
      const response = await axios.get("http://localhost:5001/api/auth/me");
      setUser(response.data);
      localStorage.setItem("user", JSON.stringify(response.data));
    } catch (error) {
      console.error("Token verification failed:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setAuthToken(null);
      setUser(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      const storedUser = localStorage.getItem("user");

      if (token && storedUser) {
        try {
          // Parse stored user first for immediate UI update
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setAuthToken(token);

          // Then verify with server
          await verifyAndSetUser(token);
        } catch (error) {
          console.error("Error initializing auth:", error);
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setUser(null);
          setAuthToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();

    // Listen for storage changes (for cross-tab sync)
    const handleStorageChange = (e) => {
      if (e.key === "token" || e.key === "user") {
        initializeAuth();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (email, password) => {
    try {
      const response = await axios.post(
        "http://localhost:5001/api/auth/login",
        { email, password }
      );

      const { token, ...userData } = response.data;

      // Store everything
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      // Set axios header
      setAuthToken(token);

      // Set user state
      setUser(userData);

      // Dispatch event for other components to know about login
      window.dispatchEvent(new Event("userLoggedIn"));

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await axios.post(
        "http://localhost:5001/api/auth/register",
        { username, email, password }
      );

      const { token, ...userData } = response.data;

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));
      setAuthToken(token);
      setUser(userData);

      window.dispatchEvent(new Event("userLoggedIn"));

      return { success: true };
    } catch (error) {
      console.error("Register error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Registration failed",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuthToken(null);
    setUser(null);
    window.dispatchEvent(new Event("userLoggedOut"));
  };

  // Helper function to check if user is authenticated
  const isAuthenticated = () => {
    return !!localStorage.getItem("token");
  };

  // Helper to get token directly
  const getToken = () => {
    return localStorage.getItem("token");
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated,
    getToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
