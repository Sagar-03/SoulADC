import React from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { FaBook, FaUsers, FaPlus, FaFilePdf, FaSignOutAlt, FaClipboardList, FaCheckCircle } from "react-icons/fa";
import { FiMessageCircle } from "react-icons/fi";
import logo from "../../assets/logo.png";
import { logout } from "../../utils/auth";

const AdminSidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = () => {
        logout(); // clears cookies + emits auth change
        navigate("/login"); // redirect to login
    };
    return (
        <div
            className="bg-white border-end shadow-sm d-flex flex-column align-items-start p-3"
            style={{ width: "220px", minHeight: "100%", borderRadius: "12px" }}
        >
            {/* Logo */}
            <div className="d-flex align-items-center justify-content-center w-100 mb-3">
                <Link to="/">
                    <img
                        src={logo}
                        alt="Logo"
                        style={{ width: "210px", cursor: "pointer" }}
                    />
                </Link>
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
                    text="Manage Courses"
                    active={location.pathname.startsWith("/admin/courses")}
                    onClick={() => navigate("/admin/courses")}
                />
                <SidebarItem
                    icon={<FaPlus />}
                    text="Add Course"
                    active={location.pathname === "/admin/courses/add"}
                    onClick={() => navigate("/admin/courses/add")}
                />
                <SidebarItem
                    icon={<FaFilePdf />}
                    text="Bulk PDF Upload"
                    active={location.pathname === "/admin/bulk-pdf-upload"}
                    onClick={() => navigate("/admin/bulk-pdf-upload")}
                />
                <SidebarItem
                    icon={<FaUsers />}
                    text="Students"
                    active={location.pathname === "/admin/students"}
                    onClick={() => navigate("/admin/students")}
                />
                <SidebarItem
                    icon={<FaCheckCircle />}
                    text="Pending Approvals"
                    active={location.pathname === "/admin/pending-approvals"}
                    onClick={() => navigate("/admin/pending-approvals")}
                />
                <SidebarItem
                    icon={<FiMessageCircle />}
                    text="Doubts Section"
                    active={location.pathname === "/admin/admindoubts"}
                    onClick={() => navigate("/admin/admindoubts")}
                />
                <SidebarItem
                    icon={<FiMessageCircle />}
                    text="Documents Section"
                    active={location.pathname === "/admin/documents"}
                    onClick={() => navigate("/admin/documents")}
                />
                <SidebarItem
                    icon={<FaClipboardList />}
                    text="Mock Exams"
                    active={location.pathname.startsWith("/admin/manage-mocks") || location.pathname.startsWith("/admin/create-mock") || location.pathname.startsWith("/admin/edit-mock") || location.pathname.startsWith("/admin/preview-mock")}
                    onClick={() => navigate("/admin/manage-mocks")}
                />
                <SidebarItem
                    icon={<FaSignOutAlt />}
                    text="Sign Out"
                    onClick={handleSignOut}
                    hoverColor="red"
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
