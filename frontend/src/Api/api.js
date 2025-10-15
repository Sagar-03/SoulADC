import axios from "axios";
import { getCookie } from "../utils/cookies";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:7001/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = getCookie("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { api };
// ============================
// Auth APIs
// ============================
export const loginAdmin = (credentials) => api.post("/auth/login", credentials);

// ============================
// Courses APIs
// ============================
export const getCourses = (courseId) => courseId ? api.get(`/admin/courses/${courseId}`) : api.get("/admin/courses");
export const getLiveCourses = () => api.get("/user/courses/live");
export const createCourse = (data) => api.post("/admin/courses", data);
export const updateCourse = (courseId, data) => api.put(`/admin/courses/${courseId}`, data);
export const deleteCourse = (courseId) => api.delete(`/admin/courses/${courseId}`);
export const toggleCourseLiveApi = (courseId) => api.patch(`/admin/courses/${courseId}/toggle-live`);
export const addWeek = (courseId, weekNumber, weekTitle) =>
  api.post(`/admin/courses/${courseId}/weeks`, {
    weekNumber: parseInt(weekNumber),
    title: weekTitle,
  });
export const addDay = (courseId, weekId, dayTitle) =>
  api.post(`/admin/courses/${courseId}/weeks/${weekId}/days`, {
    dayTitle: dayTitle || "",
  });
export const deleteWeek = (courseId, weekId) => api.delete(`/admin/courses/${courseId}/weeks/${weekId}`);
export const deleteDay = (courseId, weekId, dayId) => api.delete(`/admin/courses/${courseId}/weeks/${weekId}/days/${dayId}`);
export const addContent = (courseId, weekNumber, formData) =>
  api.post(`/admin/courses/${courseId}/weeks/${weekNumber}/content`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });
export const fetchcourse = () => api.patch(`/admin/courses/${courseId}/toggle-live`);
// ============================
// Student APIs
// ============================
export const getStudents = () => api.get("/admin/students"); // assume you add this route later

// ============================
// export const getStreamUrl = (s3Key) => `http://localhost:7001/api/stream/${s3Key}`;
export const getStreamUrl = (s3Key) => `${API_BASE_URL}/stream/${s3Key}`;


export const getPresignUrl = (fileName, fileType, folder, weekNumber, dayNumber) =>
  api.get("/upload/presign", {
    params: { fileName, fileType, folder, weekNumber, dayNumber },
  });

// Save uploaded content metadata
export const saveContent = (courseId, weekId, dayId, contentData) =>
  api.post(`/admin/courses/${courseId}/weeks/${weekId}/days/${dayId}/contents`, contentData);

// Delete a content item
export const deleteContent = (courseId, weekId, dayId, contentId) =>
  api.delete(`/admin/courses/${courseId}/weeks/${weekId}/days/${dayId}/contents/${contentId}`);

// Update content title
export const updateContentTitle = (courseId, weekId, dayId, contentId, title) =>
  api.put(`/admin/courses/${courseId}/weeks/${weekId}/days/${dayId}/contents/${contentId}`, { title });


// Delete a week
export const deleteWeekApi = (courseId, weekId) =>
  api.delete(`/admin/courses/${courseId}/weeks/${weekId}`);

// Delete a day
export const deleteDayApi = (courseId, weekId, dayId) =>
  api.delete(`/admin/courses/${courseId}/weeks/${weekId}/days/${dayId}`);

// Create Stripe checkout session
export const createCheckoutSession = (payload) => api.post("/payment/create-checkout-session", payload);

// Handle payment success
export const PaymentSuccessApi = (sessionId, courseId) =>
  api.get(`/payment/success`, { params: { session_id: sessionId, course_id: courseId } });

// ============================
// Multipart Upload APIs
// ============================
export const initiateMultipartUpload = (fileName, fileType, folder, weekNumber, dayNumber) =>
  api.post("/multipart-upload/initiate", { fileName, fileType, folder, weekNumber, dayNumber });

export const getPresignedPartUrl = (key, uploadId, partNumber) =>
  api.post("/multipart-upload/presign-part", { key, uploadId, partNumber });

export const completeMultipartUpload = (key, uploadId, parts) =>
  api.post("/multipart-upload/complete", { key, uploadId, parts });

export const abortMultipartUpload = (key, uploadId) =>
  api.post("/multipart-upload/abort", { key, uploadId });

// ============================
// Doubt System APIs
// ============================

// Create or update a student's doubt (when student sends message)
export const sendStudentDoubt = (userId, userName, message) =>
  api.post("/doubts/student", { userId, userName, message });

// Admin reply to a doubt
export const replyToDoubt = (doubtId, message) =>
  api.post(`/doubts/admin/reply/${doubtId}`, { message });

// Close a doubt manually
export const closeDoubt = (doubtId) => api.patch(`/doubts/close/${doubtId}`);

// Get all doubts (Admin view)
export const getAllDoubts = () => api.get("/doubts");

// Get open doubts for a student
export const getStudentDoubts = (userId) => api.get(`/doubts/student/${userId}`);


