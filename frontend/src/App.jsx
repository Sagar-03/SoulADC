import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Pages/home";
import CoursesPage from "./Pages/course";

// Student Dashboard
import Studentdashboard from "./Components/student/Studentdashboard";
import Mycourse from "./Components/student/Mycourse/mycourse";
import Dashboard from "./Components/student/Dashboard/PurchasedDashboard";

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
        {/* Redirect root "/" to "/Home" */}
        <Route path="/" element={<Navigate to="/Home" replace />} />

        <Route path="/Home" element={<Home />} />
        <Route path="/courses" element={<CoursesPage />} />

        {/* Student Portal - Main Route */}
        <Route path="/student-portal" element={<Studentdashboard />} />

        {/* Student Dashboard */}
        <Route path="/studentdashboard" element={<Studentdashboard />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Mycourse" element={<Mycourse />} />

        {/* Admin Portal - Main Route */}
        <Route path="/admin" element={<Admindashboard />} />

        {/* Admin Dashboard */}
        <Route path="/admindashboard" element={<Admindashboard />} />
        <Route path="/admin/dashboard" element={<A_Dashboard />} />
        <Route path="/admin/students" element={<ManageStudents />} />
        <Route path="/admin/courses" element={<ManageCourses />} />
        <Route path="/admin/courses/add" element={<AddCourse />} />
        <Route path="/admin/courses/:id/manage" element={<CourseContentManager />} />


        {/* Optional: catch all invalid routes */}
        {/* <Route path="*" element={<Navigate to="/Home" replace />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
