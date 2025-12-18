import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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


// Student Dashboard
import Studentdashboard from "./Components/student/Studentdashboard";
import Mycourse from "./Components/student/Mycourse/mycourse";
import Dashboard from "./Components/student/Dashboard/PurchasedDashboard";
import ProgressDashboard from "./Components/student/Dashboard/ProgressDashboard";
import EmbeddedVideoPlayer from "./Components/VideoPlayer/EmbeddedVideoPlayer";
import StudentDoubtPanel from "./Components/student/Studentdoubt";
import StudentProfile from "./Components/student/Profile/StudentProfile";
import DocumentsPage from "./Components/student/Documents/DocumentsPage";
import StudentDocuments from "./Components/student/Documents/StudentDocuments";
import DocumentViewer from "./Components/VideoPlayer/DocumentViewer";

// Payment Components
import PaymentPage from "./Components/PaymentDashboard/PaymentPage";
import MockPaymentPage from "./Components/PaymentDashboard/MockPaymentPage";
import PaymentSuccess from "./Components/PaymentDashboard/PaymentSuccess";
import PaymentCancel from "./Components/PaymentDashboard/PaymentCancel";

// Admin Dashboard
import Admindashboard from "./Components/admin/Admindashboard";
import A_Dashboard from "./Components/admin/Dashboard";
import ManageCourses from "./Components/admin/ManageCourses";
import ManageStudents from "./Components/admin/ManageStudents";
import PendingApprovals from "./Components/admin/PendingApprovals";
import AddCourse from "./Components/admin/AddCourse";
import EditCourse from "./Components/admin/EditCourse";
import CourseContentManager from "./Components/admin/CourseContentManager";
import BulkPdfUpload from "./Components/admin/BulkPdfUpload";
import AdminDoubtDashboard from "./Components/admin/AdminDoubtPanel";
import AdminDocuments from "./Components/admin/admindocument";

// Mock Exam Components
import ManageMocks from "./Components/admin/ManageMocks";
import CreateMock from "./Components/admin/CreateMock";
import EditMock from "./Components/admin/EditMock";
import PreviewMock from "./Components/admin/PreviewMock";
import StudentMocks from "./Components/student/StudentMocks";
import MockAttempt from "./Components/student/MockAttempt";
import MockResult from "./Components/student/MockResult";
import MocksPage from "./Components/MocksPage/MocksPage";

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
  if (requirePurchased && 
      (!user?.purchasedCourses || user.purchasedCourses.length === 0) && 
      (!user?.purchasedMocks || user.purchasedMocks.length === 0)) {
    return <Navigate to="/courses" replace />;
  }

  // ✅ Passed all checks
  return children;
};

function App() {
  return (
    <Router>
      <ToastContainer
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
        transition:Bounce
        style={{ zIndex: 99999 }}
      />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/Home" replace />} />
        <Route path="/Home" element={<Home />} />
        <Route path="/courses" element={<CoursesPage />} />
        <Route path="/mocks" element={<MocksPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/About" element={<About />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/Tnc" element={<Tnc />} />
        <Route path="/ContactUs" element={<ContactUs />} />
        {/* <Route path="/studentdoubts" element={<StudentDoubtPanel />} />
        <Route path="/admindoubts" element={<AdminDoubtPanel />} /> */}




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
          path="/progress"
          element={
            <ProtectedRoute requirePurchased={true}>
              <ProgressDashboard />
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
        <Route
          path="/studentdashboard/doubtpanel"
          element={
            <ProtectedRoute>
              <StudentDoubtPanel />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <StudentProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents"
          element={
            <ProtectedRoute requirePurchased={true}>
              <DocumentsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:courseId"
          element={
            <ProtectedRoute requirePurchased={true}>
              <StudentDocuments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/documents/:courseId/view/:documentId"
          element={
            <ProtectedRoute requirePurchased={true}>
              <DocumentViewer />
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
        <Route
          path="/payment/mock"
          element={
            <ProtectedRoute>
              <MockPaymentPage />
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
          path="/admin/pending-approvals"
          element={
            <ProtectedRoute adminOnly={true}>
              <PendingApprovals />
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
          path="/admin/admindoubts"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDoubtDashboard />
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
        <Route
          path="/admin/documents"
          element={
            <ProtectedRoute adminOnly={true}>
              <AdminDocuments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/manage-mocks"
          element={
            <ProtectedRoute adminOnly={true}>
              <ManageMocks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-mock"
          element={
            <ProtectedRoute adminOnly={true}>
              <CreateMock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/edit-mock/:id"
          element={
            <ProtectedRoute adminOnly={true}>
              <EditMock />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/preview-mock/:id"
          element={
            <ProtectedRoute adminOnly={true}>
              <PreviewMock />
            </ProtectedRoute>
          }
        />

        {/* Student Mock Routes */}
        <Route
          path="/student/mocks"
          element={
            <ProtectedRoute requirePurchased={true}>
              <StudentMocks />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/mock-attempt/:mockId"
          element={
            <ProtectedRoute requirePurchased={true}>
              <MockAttempt />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student/mock-result/:attemptId"
          element={
            <ProtectedRoute requirePurchased={true}>
              <MockResult />
            </ProtectedRoute>
          }
        />
      </Routes>

    </Router>
  );
}

export default App;
