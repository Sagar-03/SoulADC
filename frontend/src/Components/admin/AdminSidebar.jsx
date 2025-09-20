import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { FaBook, FaUsers, FaUpload } from "react-icons/fa";
import logo from "../../assets/logo.png";

const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div
            className="bg-white border-end shadow-sm d-flex flex-column align-items-start p-3"
            style={{ width: "220px", minHeight: "100%", borderRadius: "12px" }}
        >
            {/* Logo */}
            <div className="d-flex align-items-center justify-content-center w-100 mb-3">
                <img src={logo} alt="Logo" style={{ width: "210px" }} />
            </div>

            {/* Nav */}
            <div className="nav flex-column w-100 mt-4 fs-5">
                <SidebarItem
                    icon={<RxDashboard />}
                    text="Dashboard"
                    active={location.pathname === "/admin/dashboard"}
                    onClick={() => navigate("/admin/dashboard")}
                />
                <SidebarItem
                    icon={<FaBook />}
                    text="Courses"
                    active={location.pathname === "/admin/courses"}
                    onClick={() => navigate("/admin/courses")}
                />
                <SidebarItem
                    icon={<FaUsers />}
                    text="Students"
                    active={location.pathname === "/admin/students"}
                    onClick={() => navigate("/admin/students")}
                />
                <SidebarItem
                    icon={<FaUpload />}
                    text="Upload Content"
                    active={location.pathname === "/admin/upload"}
                    onClick={() => navigate("/admin/upload")}
                />
            </div>
        </div>
    );
};

const SidebarItem = ({ icon, text, active, onClick }) => (
    <button
        className={`btn text-start d-flex align-items-center mb-2 w-100 ${active ? "active-sidebar" : ""
            }`}
        style={{
            gap: "10px",
            padding: "10px 12px",
            fontSize: "15px",
            borderRadius: "8px",
        }}
        onClick={onClick}
    >
        {icon}
        <span>{text}</span>
    </button>
);

export default AdminSidebar;
