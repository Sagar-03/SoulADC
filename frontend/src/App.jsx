import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "./Pages/Home";
import About from "./Pages/AboutPage/About";
import CoursesPage from "./Pages/course";
import Login from "./Pages/Login";
// 🔹 Protected Route Wrapper
import { isAuthenticated, getUser, getUserRole } from "./utils/auth";
import ForgotPassword from "./Components/student/ForgotPassword/ForgotPassword";
import ResetPassword from "./Components/student/ForgotPassword/ForgotPassword";
import Tnc from "./Pages/SoulADCTerms";
import ContactUs from "./Components/ContactUs/ContactUs";
import StudentDoubtPanel from "./components/student/StudentDoubtPanel";
import AdminDoubtPanel from "./components/admin/AdminDoubtPanel";

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
import EditCourse from "./Components/admin/EditCourse";
import CourseContentManager from "./Components/admin/CourseContentManager";
import BulkPdfUpload from "./Components/admin/BulkPdfUpload";

// 🔹 Protected Route Wrapper
const ProtectedRoute = ({ children, requirePurchased = false, adminOnly = false }) => {
  const user = getUser();          // comes from cookie
  const role = getUserRole();      // comes from cookie
  const loggedIn = isAuthenticated();


  //  If not logged in at all
  if (!loggedIn) return <Navigate to="/login" replace />;

  //  If route is admin-only but user isn’t admin
  if (adminOnly && role !== "admin") {
    return <Navigate to="/" replace />;
  }

  //  If student route requires purchased course but user has none
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
        <Route path="/About" element={<About />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/Tnc" element={<Tnc />} />
        <Route path="/ContactUs" element={<ContactUs />} />
        <Route path="/studentdoubts" element={<StudentDoubtPanel />} />
        <Route path="/admindoubts" element={<AdminDoubtPanel />} />




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
          path="/admin/courses/:courseId/edit"
          element={
            <ProtectedRoute adminOnly={true}>
              <EditCourse />
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
        <Route
          path="/admin/bulk-pdf-upload"
          element={
            <ProtectedRoute adminOnly={true}>
              <BulkPdfUpload />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
