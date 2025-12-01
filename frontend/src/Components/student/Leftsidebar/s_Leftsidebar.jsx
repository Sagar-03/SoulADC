import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { FaBook, FaSignOutAlt, FaFileAlt, FaChartLine, FaClipboardList } from "react-icons/fa";
import { FiMessageCircle } from "react-icons/fi";

import { CgProfile } from "react-icons/cg";
import { logout, getUser } from "../../../utils/auth"; // ✅ cookie-based logout
import logo from "../../../assets/logo.png";
import PurchaseCourseModal from "./PurchaseCourseModal";

const Leftsidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = getUser();
    setUser(userData);
  }, []);

  // ✅ Check if user has only mock access (no courses purchased)
  const hasOnlyMockAccess = () => {
    if (!user) return false;
    const hasCourses = user.purchasedCourses && user.purchasedCourses.length > 0;
    const hasMocks = user.purchasedMocks && user.purchasedMocks.length > 0;
    return !hasCourses && hasMocks;
  };

  // ✅ Handle restricted navigation
  const handleRestrictedClick = (navigateTo) => {
    if (hasOnlyMockAccess()) {
      setShowModal(true);
    } else {
      navigate(navigateTo);
    }
  };

  // ✅ Force signout function
  const handleSignOut = () => {
    logout(); // clears cookies + emits auth change
    navigate("/login"); // redirect to login
  };

  return (
    <>
      <PurchaseCourseModal isOpen={showModal} onClose={() => setShowModal(false)} />
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
            icon={<FaChartLine />}
            text="Dashboard"
            active={location.pathname === "/progress"}
            onClick={() => handleRestrictedClick("/progress")}
            hoverColor="linear-gradient(145deg, #A98C6A, #7B563D)"
          />
          <SidebarItem
            icon={<RxDashboard />}
            text="My Courses"
            active={location.pathname === "/Dashboard"}
            onClick={() => handleRestrictedClick("/Dashboard")}
            hoverColor="linear-gradient(145deg, #A98C6A, #7B563D)"
          />
          <SidebarItem
            icon={<FaFileAlt />}
            text="Documents"
            active={location.pathname.includes("/documents")}
            onClick={() => handleRestrictedClick("/documents")}
            hoverColor="linear-gradient(145deg, #A98C6A, #7B563D)" />
          <SidebarItem
            icon={<FiMessageCircle />}
            text="Doubts Section"
            active={location.pathname === "/studentdashboard/doubtpanel"}
            onClick={() => navigate("/studentdashboard/doubtpanel")}
            hoverColor="linear-gradient(145deg, #A98C6A, #7B563D)"
          />
          <SidebarItem
            icon={<FaClipboardList />}
            text="Mock Exams"
            active={location.pathname.startsWith("/student/mock")}
            onClick={() => navigate("/student/mocks")}
            hoverColor="linear-gradient(145deg, #A98C6A, #7B563D)"
          />
          {/* <SidebarItem
            icon={<FaBook />}
            text="Courses"
            active={location.pathname === "/mycourse"}
            onClick={() => navigate("/mycourse")}
            hoverColor="linear-gradient(145deg, #A98C6A, #7B563D)"
          /> */}
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

          {/* ✅ Real Logout Button */}
          <SidebarItem
            icon={<FaSignOutAlt />}
            text="Sign Out"
            onClick={handleSignOut}
            hoverColor="red"
          />

        </div>
      </div>
    </>
  );
};

// Reusable sidebar button
const SidebarItem = ({ icon, text, active, onClick, hoverColor }) => (
  <button
    className={`btn text-start d-flex align-items-center mb-2 w-100 ${active ? "active-sidebar" : ""
      }`}
    style={{
      gap: "10px",
      padding: "10px 12px",
      fontSize: "15px",
      borderRadius: "8px",
      transition: "background 0.2s ease, color 0.2s ease",
    }}
    onClick={onClick}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = hoverColor;
      e.currentTarget.style.color = "#fff";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = active ? hoverColor : "";
      e.currentTarget.style.color = "";
    }}
  >
    {icon}
    <span>{text}</span>
  </button>
);

export default Leftsidebar;
