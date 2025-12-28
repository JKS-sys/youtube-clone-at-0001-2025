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
  FaPlusCircle,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = ({
  isCollapsed = false,
  mobileMenuOpen = false,
  onToggleCollapse,
  onCloseMobileMenu,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

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

  const sidebarItems = [
    { icon: <FaHome />, label: "Home", path: "/" },
    { icon: <FaFire />, label: "Trending", path: "/trending" },
    { icon: <FaYoutube />, label: "Subscriptions", path: "/subscriptions" },
    { icon: <FaFolder />, label: "Library", path: "/library" },
    { icon: <FaHistory />, label: "History", path: "/history" },
    { icon: <FaPlayCircle />, label: "Your videos", path: "/your-videos" },
    { icon: <FaThumbsUp />, label: "Liked videos", path: "/liked-videos" },
    {
      icon: <FaPlusCircle />,
      label: "Create Channel",
      path: "/create-channel",
    },
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
