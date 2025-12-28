// frontend/src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";

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

  // Simple function to get user from localStorage
  const getUserFromStorage = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData && userData !== "undefined") {
        return JSON.parse(userData);
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
    }
    return null;
  };

  // Initialize auth state
  useEffect(() => {
    const userData = getUserFromStorage();
    setUser(userData);
    setLoading(false);

    console.log("🔧 AuthProvider initialized:", { user: userData });
  }, []);

  // Listen for storage changes
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "user" || e.key === "token") {
        const userData = getUserFromStorage();
        console.log("🔄 Storage changed, updating user:", userData);
        setUser(userData);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const login = async (email, password) => {
    try {
      // We'll handle API call in the Auth component
      // This function just updates state
      const userData = getUserFromStorage();
      setUser(userData);
      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    console.log("✅ Logged out");
  };

  // Helper to check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem("token");
    const userData = localStorage.getItem("user");
    return !!(token && userData);
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
