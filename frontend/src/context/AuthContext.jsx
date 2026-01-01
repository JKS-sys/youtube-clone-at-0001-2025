// frontend/src/context/AuthContext.jsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
} from "react";
import { authAPI } from "../services/api";

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

  // ✅ CRITICAL: Load user from localStorage on app start
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          console.log("✅ User loaded from storage:", parsedUser.username);
        }
      } catch (err) {
        console.error("❌ Error loading user from storage:", err);
        logout(); // Clear corrupted data
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // ✅ CRITICAL: Get the current token (used by API service)
  const getToken = useCallback(() => {
    return localStorage.getItem("token");
  }, []);

  // ✅ Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    const token = getToken();
    return !!token && !!user;
  }, [getToken, user]);

  const login = useCallback(async (email, password) => {
    try {
      const response = await authAPI.login(email, password);

      if (response.data) {
        const { token, ...userData } = response.data;

        // ✅ Save to localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));

        // ✅ Update state
        setUser(userData);

        console.log("✅ Login successful, token saved.");
        return { success: true, data: userData };
      }
    } catch (err) {
      console.error("❌ Login error:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Login failed",
      };
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    try {
      const response = await authAPI.register(username, email, password);

      if (response.data) {
        const { token, ...userData } = response.data;

        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));
        setUser(userData);

        return { success: true, data: userData };
      }
    } catch (err) {
      console.error("❌ Registration error:", err);
      return {
        success: false,
        error: err.response?.data?.message || "Registration failed",
      };
    }
  }, []);

  const logout = useCallback(() => {
    console.log("✅ Logging out...");
    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    // Clear state
    setUser(null);
    // Redirect to home
    window.location.href = "/";
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    isAuthenticated,
    getToken, // ✅ Expose this function
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
