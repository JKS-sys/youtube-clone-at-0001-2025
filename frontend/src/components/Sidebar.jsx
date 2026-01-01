import React, { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  FaHome,
  FaFire,
  FaYoutube,
  FaHistory,
  FaPlayCircle,
  FaThumbsUp,
  FaFolder,
  FaCog,
  FaChevronLeft,
  FaChevronRight,
  FaUserCircle,
} from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = ({
  isCollapsed = false,
  mobileMenuOpen = false,
  onToggleCollapse,
  onCloseMobileMenu,
}) => {
  const [isMobile, setIsMobile] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    // Load user from localStorage
    const loadUser = () => {
      try {
        const userData = localStorage.getItem("user");
        if (userData && userData !== "undefined") {
          setUser(JSON.parse(userData));
        }
      } catch (error) {
        console.error("Error parsing user data:", error);
        setUser(null);
      }
    };

    loadUser();

    // Listen for toggle events from header
    const handleToggleEvent = () => {
      if (onToggleCollapse) onToggleCollapse();
    };

    window.addEventListener("toggleSidebar", handleToggleEvent);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
      window.removeEventListener("toggleSidebar", handleToggleEvent);
    };
  }, [onToggleCollapse]);

  const baseSidebarItems = [
    { icon: <FaHome />, label: "Home", path: "/" },
    { icon: <FaFire />, label: "Trending", path: "/trending" },
    { icon: <FaYoutube />, label: "Subscriptions", path: "/subscriptions" },
    { icon: <FaFolder />, label: "Library", path: "/library" },
    { icon: <FaHistory />, label: "History", path: "/history" },
    { icon: <FaPlayCircle />, label: "Your videos", path: "/your-videos" },
    { icon: <FaThumbsUp />, label: "Liked videos", path: "/liked-videos" },
  ];

  // Add Manage Channel only if user is logged in
  const sidebarItems = [
    ...baseSidebarItems,
    ...(user
      ? [{ icon: <FaCog />, label: "Manage Channel", path: "/manage-channel" }]
      : []),
  ];

  const categories = [
    "Music",
    "Sports",
    "Gaming",
    "Education",
    "Entertainment",
    "Technology",
  ];

  const handleItemClick = () => {
    if (isMobile && onCloseMobileMenu) {
      onCloseMobileMenu();
    }
  };

  return (
    <>
      <div
        className={`sidebar ${isCollapsed ? "sidebar--collapsed" : ""} ${
          mobileMenuOpen ? "sidebar--mobile-open" : ""
        }`}
        onClick={(e) => {
          if (
            isMobile &&
            mobileMenuOpen &&
            e.target.classList.contains("sidebar")
          ) {
            onCloseMobileMenu();
          }
        }}
      >
        {/* Desktop Toggle Button */}
        {!isMobile && (
          <button className="sidebar__toggle" onClick={onToggleCollapse}>
            {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
          </button>
        )}

        <div className="sidebar__section">
          {sidebarItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `sidebar__item ${isActive ? "active" : ""}`
              }
              onClick={handleItemClick}
            >
              <span className="sidebar__icon">{item.icon}</span>
              {!isCollapsed && (
                <span className="sidebar__label">{item.label}</span>
              )}
            </NavLink>
          ))}
        </div>

        {!isCollapsed && (
          <>
            <div className="sidebar__section">
              <h3 className="sidebar__title">Categories</h3>
              {categories.map((category, index) => (
                <button
                  key={index}
                  className="sidebar__category"
                  onClick={handleItemClick}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="sidebar__footer">
              <p>YouTube Clone © 2024</p>
              {user ? (
                <p className="sidebar__user">
                  <FaUserCircle /> {user.username}
                </p>
              ) : (
                <p className="sidebar__login-prompt">
                  <a href="/auth">Sign in</a> to manage your channel
                </p>
              )}
            </div>
          </>
        )}
      </div>

      {/* Overlay for mobile */}
      {isMobile && mobileMenuOpen && (
        <div className="sidebar__overlay" onClick={onCloseMobileMenu} />
      )}
    </>
  );
};

export default Sidebar;
