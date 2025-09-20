import axios from "axios";

// Base API instance
const api = axios.create({
  baseURL: "http://localhost:5000/api", // backend base URL
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
export const createCourse = (data) => api.post("/admin/courses", data);
export const addWeek = (courseId, data) => api.post(`/admin/courses/${courseId}/weeks`, data);
export const addContent = (courseId, weekNumber, formData) =>
  api.post(`/admin/courses/${courseId}/weeks/${weekNumber}/content`, formData, {
    headers: { "Content-Type": "multipart/form-data" }
  });

// ============================
// Student APIs
// ============================
export const getStudents = () => api.get("/admin/students"); // assume you add this route later
