import axios from "axios";

// Base API instance
const api = axios.create({
  baseURL: "http://localhost:7001/api", // backend base URL - updated to match backend port
});

// Add auth token automatically
api.interceptors.request.use(config => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// ============================
// Auth APIs
// ============================
export const loginAdmin = (credentials) => api.post("/auth/login", credentials);

// ============================
// Courses APIs
// ============================
export const getCourses = () => api.get("/courses");
export const getLiveCourses = () => api.get("/user/courses/live");
export const createCourse = (data) => api.post("/admin/courses", data);
export const toggleCourseLive = (courseId) => api.patch(`/admin/courses/${courseId}/toggle-live`);
export const addWeek = (courseId, data) => api.post(`/admin/courses/${courseId}/weeks`, data);
export const deleteWeek = (courseId, weekId) => api.delete(`/admin/courses/${courseId}/weeks/${weekId}`);
export const deleteDay = (courseId, weekId, dayId) => api.delete(`/admin/courses/${courseId}/weeks/${weekId}/days/${dayId}`);
export const addContent = (courseId, weekNumber, formData) =>
  api.post(`/admin/courses/${courseId}/weeks/${weekNumber}/content`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

// ============================
// Student APIs
// ============================
export const getStudents = () => api.get("/admin/students"); // assume you add this route later
