import React from "react";
import AdminSidebar from "./AdminSidebar";

const AdminLayout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <div className="sidebar-wrapper">
          <AdminSidebar />
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 p-4" style={{ background: "#FAF9F6" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
