import React from "react";
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
} from "react-icons/fa";
import "./Sidebar.css";

const Sidebar = () => {
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
    <div className="sidebar">
      <div className="sidebar__section">
        {sidebarItems.map((item, index) => (
          <NavLink
            key={index}
            to={item.path}
            className={({ isActive }) =>
              `sidebar__item ${isActive ? "active" : ""}`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>

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
    </div>
  );
};

export default Sidebar;
