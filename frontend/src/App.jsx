import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import CoursesPage from "./Pages/course";

// Student Dashboard
import Studentdashboard from "./Components/student/Studentdashboard";
import Mycourse from "./Components/student/Mycourse/mycourse";
import Dashboard from "./Components/student/Dashboard/PurchasedDashboard";
import EmbeddedVideoPlayer from "./Components/VideoPlayer/EmbeddedVideoPlayer";

// Payment Components
import PaymentPage from "./Components/PaymentDashboard/PaymentPage";
import PaymentSuccess from "./Components/PaymentDashboard/PaymentSuccess";
import PaymentCancel from "./Components/PaymentDashboard/PaymentCancel";

// Admin Dashboard
import Admindashboard from "./Components/admin/Admindashboard";
import A_Dashboard from "./Components/admin/Dashboard";
import ManageCourses from "./Components/admin/ManageCourses";
import ManageStudents from "./Components/admin/ManageStudents";
// import CourseUploadForm from "./Components/admin/CourseUploadForm";
import AddCourse from "./Components/admin/AddCourse";
import CourseContentManager from "./Components/admin/CourseContentManager";

function App() {
  return (
    <Router>
      <Routes>
        {/* Normal Route*/}
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/courses" element={<CoursesPage />} />

        

        {/* Student Dashboard */}
        <Route path="/studentdashboard" element={<Studentdashboard />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Mycourse" element={<Mycourse />} />
        <Route path="/mycourse/:courseId" element={<Mycourse />} />
        <Route path="/student/course/:courseId" element={<Mycourse />} />
        <Route path="/student/course/:courseId/video/:videoId" element={<EmbeddedVideoPlayer />} />
        
        {/* Payment Routes */}
        <Route path="/payment" element={<PaymentPage />} />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancel" element={<PaymentCancel />} />

        {/* Admin Portal - Main Route */}
        <Route path="/admin" element={<Admindashboard />} />
        <Route path="/admindashboard" element={<Admindashboard />} />
        <Route path="/admin/dashboard" element={<A_Dashboard />} />
        <Route path="/admin/students" element={<ManageStudents />} />
        <Route path="/admin/courses" element={<ManageCourses />} />
        <Route path="/admin/courses/add" element={<AddCourse />} />
        <Route path="/admin/courses/:id/manage" element={<CourseContentManager />} />


      </Routes>
    </Router>
  );
}

export default App;
  