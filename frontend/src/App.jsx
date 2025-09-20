import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./Pages/home";
import CoursesPage from "./Pages/course";
// import About from "./Pages/about";
// import Contact from "./Pages/contact";

//Student Dashboard
import Studentdashboard from "./Components/student/Studentdashboard";
import Mycourse from "./Components/student/Mycourse/mycourse";
import Dashboard from "./Components/student/Dashboard/PurchasedDashboard";

//Admin Dashboard
import Admindashboard from "./Components/admin/Admindashboard";
import A_Dashboard from "./Components/admin/Dashboard";
import ManageCourses from "./Components/admin/ManageCourses";
import ManageStudents from "./Components/admin/ManageStudents";
import CourseUploadForm from "./Components/admin/CourseUploadForm";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/Home" element={<Home />} />
        <Route path="/courses" element={<CoursesPage />} />
        {/* <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} /> */}

        {/* Student Dashboard */}
        <Route path="/studentdashboard" element={<Studentdashboard />} />
        <Route path="/Dashboard" element={<Dashboard />} />
        <Route path="/Mycourse" element={<Mycourse />} />

        {/* Admin Dashboard */}
        <Route path="/admindashboard" element={<Admindashboard />} />
        <Route path="/admin/dashboard" element={<A_Dashboard />} />
        <Route path="/admin/courses" element={<ManageCourses />} />
        <Route path="/admin/students" element={<ManageStudents />} />
        <Route path="/admin/upload" element={<CourseUploadForm />} />  {/* ✅ new */}

      </Routes>
    </Router>
  );
}

export default App;
