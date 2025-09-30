import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import CoursesPage from "./Pages/course";
import Login from "./Pages/Login";

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
import AddCourse from "./Components/admin/AddCourse";
import CourseContentManager from "./Components/admin/CourseContentManager";

// 🔹 Protected Route Wrapper
const ProtectedRoute = ({ children, requirePurchased = false, adminOnly = false }) => {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const role = localStorage.getItem("role");

  // 🚫 If not logged in at all
  if (!token) return <Navigate to="/login" replace />;

  // 🚫 If route is admin-only but user isn’t admin
  if (adminOnly && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  // 🚫 If student route requires purchased course but user has none
  if (requirePurchased && (!user?.purchasedCourses || user.purchasedCourses.length === 0)) {
    return <Navigate to="/courses" replace />;
  }

  // ✅ Passed all checks
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/login" element={<Login />} />

        {/* Student Dashboard (Protected: must have purchased course) */}
        <Route
          path="/studentdashboard"
          element={
            <ProtectedRoute requirePurchased={true}>
              <Studentdashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Dashboard"
          element={
            <ProtectedRoute requirePurchased={true}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Mycourse"
          element={
            <ProtectedRoute requirePurchased={true}>
              <Mycourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/mycourse/:courseId"
          element={
            <ProtectedRoute requirePurchased={true}>
              <Mycourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/course/:courseId"
          element={
            <ProtectedRoute requirePurchased={true}>
              <Mycourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/course/:courseId/video/:videoId"
          element={
            <ProtectedRoute requirePurchased={true}>
              <EmbeddedVideoPlayer />
            </ProtectedRoute>
          }
        />

        {/* Payment Routes (Protected: must be logged in, no need for purchased yet) */}
        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route path="/payment-success" element={<PaymentSuccess />} />
        <Route path="/payment-cancel" element={<PaymentCancel />} />

        {/* Admin Portal (Protected: admin only) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly={true}>
              <Admindashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admindashboard"
          element={
            <ProtectedRoute adminOnly={true}>
              <Admindashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute adminOnly={true}>
              <A_Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/students"
          element={
            <ProtectedRoute adminOnly={true}>
              <ManageStudents />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses"
          element={
            <ProtectedRoute adminOnly={true}>
              <ManageCourses />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/add"
          element={
            <ProtectedRoute adminOnly={true}>
              <AddCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/courses/:id/manage"
          element={
            <ProtectedRoute adminOnly={true}>
              <CourseContentManager />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
