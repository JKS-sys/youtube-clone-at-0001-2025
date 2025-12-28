import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaSearch,
  FaUser,
  FaBars,
  FaYoutube,
  FaSignOutAlt,
} from "react-icons/fa";
import "./Header.css";

const Header = ({ onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData && userData !== "undefined") {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error("Error parsing user data:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    }
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery.trim())}`);
      window.dispatchEvent(new Event("searchUpdated"));
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    navigate("/");
    window.location.reload();
  };

  const handleMenuClick = () => {
    if (onMenuClick) {
      onMenuClick();
    } else {
      // Fallback: dispatch event for sidebar to listen to
      window.dispatchEvent(new CustomEvent("toggleSidebar"));
    }
  };

  return (
    <header className="header">
      <div className="header__left">
        <button className="header__menu" onClick={handleMenuClick}>
          <FaBars size={20} />
        </button>
        <Link to="/" className="header__logo">
          <FaYoutube size={30} color="#FF0000" />
          <span className="header__logo-text">YouTube Clone</span>
        </Link>
      </div>

      <div className="header__center">
        <form onSubmit={handleSearch} className="header__search">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="header__search-input"
          />
          <button type="submit" className="header__search-button">
            <FaSearch />
          </button>
        </form>
      </div>

      <div className="header__right">
        {user ? (
          <div className="header__user-info">
            <img
              src={user.avatar}
              alt={user.username}
              className="header__user-avatar"
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                border: "2px solid #065fd4",
              }}
            />
            <span className="header__username">Hi, {user.username}</span>
            <button onClick={handleLogout} className="header__logout-btn">
              <FaSignOutAlt />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <Link to="/auth" className="header__signin-btn">
            <FaUser />
            <span>Sign In</span>
          </Link>
        )}
      </div>
    </header>
  );
};

export default Header;
