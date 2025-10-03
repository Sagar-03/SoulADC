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
export const toggleCourseLiveApi = (courseId) => api.patch(`/admin/courses/${courseId}/toggle-live`);
export const addWeek = (courseId, weekNumber, weekTitle) =>
  api.post(`/admin/courses/${courseId}/weeks`, {
    weekNumber: parseInt(weekNumber),
    title: weekTitle,
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


