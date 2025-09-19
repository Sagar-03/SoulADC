import React from "react";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/footer";
import Leftsidebar from "./Leftsidebar/Leftsidebar";
import Mycourse from "./Mycourse/mycourse";

const StudentDashboard = () => {
  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Navbar full width */}
      {/* <Navbar /> */}

      {/* Middle Section: Sidebar + Content */}
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <div className="sidebar-wrapper">
          <Leftsidebar />
        </div>

        {/* Course Content */}
        <div className="flex-grow-1 p-4" style={{ background: "#FAF9F6" }}>
          <Mycourse />
        </div>
      </div>

      {/* Footer full width */}
      {/* <Footer /> */}
    </div>
  );
};

export default StudentDashboard;
