import React from "react";
import Navbar from "../Navbar/Navbar";
import Footer from "../Footer/footer";
import Leftsidebar from "./Leftsidebar/s_Leftsidebar";
import Mycourse from "./Mycourse/mycourse";
import Dashboard from "./Dashboard/PurchasedDashboard";

const StudentDashboard = () => {
  return (
    <div className="d-flex flex-column min-vh-100">

      <div className="d-flex flex-grow-1">
       
       {/* Course Content */}
        <div className="flex-grow-1 p-4" style={{ background: "#FAF9F6" }}>
          <Dashboard />
        </div>
      </div>

      {/* Footer full width */}
      {/* <Footer /> */}
    </div>
  );
};

export default StudentDashboard;
