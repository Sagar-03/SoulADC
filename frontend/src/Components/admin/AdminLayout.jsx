import React from "react";
import AdminSidebar from "./AdminSidebar";
import "./admin.css";

const AdminLayout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="d-flex flex-grow-1" style={{ height: "100vh", overflow: "hidden" }}>
        {/* Sidebar - Fixed */}
        <div className="admin-sidebar-wrapper" style={{ 
          position: "fixed",
          left: 0,
          top: 0,
          height: "100vh",
          width: "220px",
          overflow: "auto",
          zIndex: 1000
        }}>
          <AdminSidebar />
        </div>

        {/* Page Content - Scrollable */}
        <div 
          className="flex-grow-1 p-4" 
          style={{ 
            background: "#FAF9F6",
            marginLeft: "220px",
            height: "100vh",
            overflow: "auto"
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
