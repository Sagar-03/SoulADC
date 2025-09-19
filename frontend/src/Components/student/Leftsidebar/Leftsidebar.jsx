import logo from "../../../assets/logo.png";
import { useNavigate, useLocation } from "react-router-dom";
import { RxDashboard } from "react-icons/rx";
import { FaBook } from "react-icons/fa6";
import { CgProfile } from "react-icons/cg";
import { FaSignOutAlt } from "react-icons/fa";
import "./Leftsidebar.css"; // import the css file

const Leftsidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <div
            className="bg-white border-end shadow-sm d-flex flex-column p-3"
            style={{
                width: "220px",
                minHeight: "100vh",
                height: "100vh",
                borderRadius: "12px",
            }}
        >
            {/* Logo */}
            <div className="d-flex align-items-center justify-content-center w-100 mb-4">
                <img src={logo} alt="Logo" style={{ width: "210px" }} />
            </div>

            {/* Menu top */}
            <div className="nav flex-column w-100 mt-5 fs-5">
                <SidebarItem
                    icon={<RxDashboard />}
                    text="Dashboard"
                    active={location.pathname === "/"}
                    onClick={() => navigate("/dashboard")}
                    hoverColor="brown-gold"
                />
                <SidebarItem
                    icon={<FaBook />}
                    text="Courses"
                    active={location.pathname === "/mycourse"}
                    onClick={() => navigate("/Mycourse")}
                    hoverColor="brown-gold"
                />
            </div>

            {/* Bottom section */}
            <div className="mt-auto w-100">
                <SidebarItem
                    icon={<CgProfile />}
                    text="Profile"
                    active={location.pathname === "/profile"}
                    onClick={() => navigate("/profile")}
                    hoverColor="blue"
                />
                <SidebarItem
                    icon={<FaSignOutAlt />}
                    text="SignOut"
                    onClick={() => alert("Signing out...")}
                    hoverColor="red"
                />
            </div>
        </div>
    );
};

const SidebarItem = ({ icon, text, onClick, active, hoverColor }) => {
    return (
        <button
            className={`sidebar-item ${hoverColor} ${active ? "active" : ""}`}
            onClick={onClick}
        >
            <span className="sidebar-icon">{icon}</span>
            <span>{text}</span>
        </button>
    );
};

export default Leftsidebar;
