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
  const [error, setError] = useState(null);

  // Load user from localStorage on initial load
  useEffect(() => {
    const loadUserFromStorage = () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (token && userData) {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);

          // Verify token is still valid by fetching profile
          authAPI.getProfile().catch(() => {
            // Token invalid, clear storage
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            localStorage.removeItem("userChannel");
            setUser(null);
          });
        }
      } catch (err) {
        console.error("Error loading user from storage:", err);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        localStorage.removeItem("userChannel");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserFromStorage();
  }, []);

  // Listen for storage changes from other tabs
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user") {
        try {
          const userData = localStorage.getItem("user");
          if (userData) {
            setUser(JSON.parse(userData));
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error("Error parsing user data:", error);
          setUser(null);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setError(null);
      const response = await authAPI.login(email, password);

      if (response.data) {
        const { token, ...userData } = response.data;

        // Store in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));

        // Update state
        setUser(userData);

        return { success: true, data: userData };
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      return {
        success: false,
        error: err.response?.data?.message || "Login failed",
      };
    }
  }, []);

  const register = useCallback(async (username, email, password) => {
    try {
      setError(null);
      const response = await authAPI.register(username, email, password);

      if (response.data) {
        const { token, ...userData } = response.data;

        // Store in localStorage
        localStorage.setItem("token", token);
        localStorage.setItem("user", JSON.stringify(userData));

        // Update state
        setUser(userData);

        return { success: true, data: userData };
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      return {
        success: false,
        error: err.response?.data?.message || "Registration failed",
      };
    }
  }, []);

  const logout = useCallback(() => {
    // Call API logout if needed
    authAPI.logout();

    // Clear state
    setUser(null);
    setError(null);

    // Clear localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("userChannel");

    // Redirect to home
    window.location.href = "/";
  }, []);

  const updateUser = useCallback(
    (userData) => {
      setUser((prev) => ({ ...prev, ...userData }));
      localStorage.setItem("user", JSON.stringify({ ...user, ...userData }));
    },
    [user]
  );

  const isAuthenticated = useCallback(() => {
    return !!localStorage.getItem("token");
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem("token");
  }, []);

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated,
    getToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
