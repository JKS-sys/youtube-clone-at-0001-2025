import React, { useState } from "react";
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
  FaBars,
} from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

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

  return (
    <>
      {/* Mobile Menu Button (visible only on small screens) */}
      <button className="sidebar__mobile-toggle" onClick={toggleMobileMenu}>
        <FaBars />
      </button>

      <div
        className={`sidebar ${isCollapsed ? "sidebar--collapsed" : ""} ${
          mobileMenuOpen ? "sidebar--mobile-open" : ""
        }`}
        onClick={() => mobileMenuOpen && setMobileMenuOpen(false)}
      >
        <div className="sidebar__toggle" onClick={toggleSidebar}>
          {isCollapsed ? <FaChevronRight /> : <FaChevronLeft />}
        </div>

        <div className="sidebar__section">
          {sidebarItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              className={({ isActive }) =>
                `sidebar__item ${isActive ? "active" : ""}`
              }
              onClick={() => setMobileMenuOpen(false)}
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
                <button key={index} className="sidebar__category">
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
      {mobileMenuOpen && (
        <div
          className="sidebar__overlay"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
