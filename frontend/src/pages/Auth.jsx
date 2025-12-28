// frontend/src/pages/Auth.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { authAPI } from "../services/api";
import "./Auth.css";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let response;

      if (isLogin) {
        // Login
        response = await authAPI.login(formData.email, formData.password);
      } else {
        // Register
        if (formData.password !== formData.confirmPassword) {
          throw new Error("Passwords do not match");
        }
        if (formData.password.length < 6) {
          throw new Error("Password must be at least 6 characters");
        }
        if (!formData.email.includes("@")) {
          throw new Error("Invalid email format");
        }

        response = await authAPI.register(
          formData.username,
          formData.email,
          formData.password
        );
      }

      const { token, ...userData } = response.data;

      // **CRITICAL: Store token and user in localStorage**
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      console.log("✅ Auth successful:", {
        token: token.substring(0, 20) + "...",
        user: userData.username,
      });

      // Force page reload to ensure all components get fresh auth state
      setTimeout(() => {
        window.location.href = "/";
      }, 100);
    } catch (err) {
      console.error("❌ Auth error:", err);
      setError(
        err.response?.data?.message || err.message || "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h2>{isLogin ? "Sign In" : "Sign Up"}</h2>
          <p className="auth-subtitle">
            {isLogin ? "Sign in to your account" : "Create a new account"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {!isLogin && (
            <div className="form-group">
              <label htmlFor="username">Username</label>
              <input
                type="text"
                id="username"
                name="username"
                placeholder="Enter your username"
                value={formData.username}
                onChange={handleChange}
                required={!isLogin}
                minLength="3"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required={!isLogin}
              />
            </div>
          )}

          {error && (
            <div className="error-message">
              <p>{error}</p>
            </div>
          )}

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
          </button>
        </form>

        <div className="auth-footer">
          <p className="toggle-text">
            {isLogin ? "Don't have an account?" : "Already have an account?"}
            <button
              type="button"
              className="toggle-button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError("");
              }}
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </button>
          </p>

          <div className="auth-divider">
            <span>OR</span>
          </div>

          <Link to="/" className="back-home">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth;
