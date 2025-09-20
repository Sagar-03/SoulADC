import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { FaBook, FaSignOutAlt } from "react-icons/fa";
import { CgProfile } from "react-icons/cg";
import logo from "../../../assets/logo.png";

const Leftsidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      className="bg-white border-end shadow-sm d-flex flex-column align-items-start p-3"
      style={{
        width: "220px",
        minHeight: "100vh",
        borderRadius: "12px",
      }}
    >
      {/* Logo */}
      <div className="d-flex align-items-center justify-content-center w-100 mb-4">
        <img src={logo} alt="Logo" style={{ width: "210px" }} />
      </div>

      {/* Top Section */}
      <div className="nav flex-column w-100 mt-4 fs-5">
        <SidebarItem
          icon={<RxDashboard />}
          text="Dashboard"
          active={location.pathname === "/Dashboard"}
          onClick={() => navigate("/Dashboard")}
          hoverColor="#8B5E3C"
        />
        <SidebarItem
          icon={<FaBook />}
          text="Courses"
          active={location.pathname === "/mycourse"}
          onClick={() => navigate("/mycourse")}
          hoverColor="#8B5E3C"
        />
      </div>

      {/* Bottom Section */}
      <div className="mt-auto w-100">
        <SidebarItem
          icon={<CgProfile />}
          text="Profile"
          active={location.pathname === "/profile"}
          onClick={() => navigate("/profile")}
          hoverColor="#5C83E6"
        />
        <SidebarItem
          icon={<FaSignOutAlt />}
          text="Sign Out"
          onClick={() => alert("Signing out...")}
          hoverColor="red"
        />
      </div>
    </div>
  );
};

const SidebarItem = ({ icon, text, active, onClick, hoverColor }) => (
  <button
    className={`btn text-start d-flex align-items-center mb-2 w-100 ${
      active ? "active-sidebar" : ""
    }`}
    style={{
      gap: "10px",
      padding: "10px 12px",
      fontSize: "15px",
      borderRadius: "8px",
      transition: "background 0.2s ease, color 0.2s ease",
    }}
    onClick={onClick}
    onMouseEnter={(e) =>
      (e.currentTarget.style.background = hoverColor, e.currentTarget.style.color = "#fff")
    }
    onMouseLeave={(e) =>
      (e.currentTarget.style.background = active ? hoverColor : "", e.currentTarget.style.color = "")
    }
  >
    {icon}
    <span>{text}</span>
  </button>
);

export default Leftsidebar;
