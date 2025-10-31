import React from "react";
import Leftsidebar from "./Leftsidebar/s_Leftsidebar";

const StudentLayout = ({ children }) => {
  return (
    <div className="d-flex flex-column min-vh-100">
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <div className="sidebar-wrapper">
          <Leftsidebar />
        </div>

        {/* Page Content */}
        <div className="flex-grow-1 p-4" style={{ background: "#FAF9F6" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

export default StudentLayout;
