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
export const getPurchasedCourses = () => api.get("/user/purchased-courses");
export const getUserStreak = () => api.get("/user/streak");
export const getProgressDashboard = () => api.get("/user/progress-dashboard");

// ============================
// export const getStreamUrl = (s3Key) => `http://localhost:7001/api/stream/${s3Key}`;
export const getStreamUrl = (s3Key) => {
  const token = getCookie("token");
  const url = `${API_BASE_URL}/stream/${s3Key}`;
  return token ? `${url}?token=${encodeURIComponent(token)}` : url;
};


export const getPresignUrl = (fileName, fileType, folder, weekNumber, dayNumber) =>
  api.get("/upload/presign", {
    params: { fileName, fileType, folder, weekNumber, dayNumber },
  });

// Save uploaded content metadata
export const saveContent = (courseId, weekId, dayId, contentData) =>
  api.post(`/admin/courses/${courseId}/weeks/${weekId}/days/${dayId}/contents`, contentData);

// Save document to module/week level
export const saveWeekDocument = (courseId, weekId, contentData) =>
  api.post(`/admin/courses/${courseId}/weeks/${weekId}/documents`, contentData);

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

// Create Stripe checkout session for mock
export const createMockCheckoutSession = (payload) => api.post("/payment/create-mock-checkout-session", payload);

// Handle payment success
export const PaymentSuccessApi = (sessionId, courseId) =>
  api.get(`/payment/success`, { params: { session_id: sessionId, course_id: courseId } });

// Handle mock payment success
export const MockPaymentSuccessApi = (sessionId, mockId) =>
  api.get(`/payment/success`, { params: { session_id: sessionId, mock_id: mockId } });

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
// Chat/Doubt System APIs
// ============================

export const getAllChats = () => api.get("/chats");

export const getChatById = (chatId) => api.get(`/chat/${chatId}`);

export const createChat = (firstMessage) =>
  api.post("/chat", { firstMessage });

export const deleteChat = (chatId) => api.delete(`/chat/${chatId}`);

export const deleteAllChats = () => api.delete("/chats/all");

export const getUserChats = () => api.get("/user-chats");

// ============================
// Chat Upload APIs
// ============================

export const uploadChatImage = (chatId, senderRole, file) => {
  const formData = new FormData();
  formData.append("file", file);
  
  // Properly construct base URL by removing only the /api suffix
  const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
  const uploadUrl = `${baseUrl}/upload/chat-image/${chatId}/${senderRole}`;
  
  console.log("Chat image upload URL:", uploadUrl);
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("Base URL:", baseUrl);
  
  return axios.post(uploadUrl, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

export const uploadChatAudio = (chatId, senderRole, audioBlob) => {
  const formData = new FormData();
  formData.append("file", audioBlob, "voiceNote.webm");
  formData.append("chatId", chatId);
  formData.append("senderRole", senderRole);
  
  // Properly construct base URL by removing only the /api suffix
  const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
  const uploadUrl = `${baseUrl}/upload/chat-audio`;
  
  console.log("Chat audio upload URL:", uploadUrl);
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("Base URL:", baseUrl);
  
  return axios.post(uploadUrl, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Get the WebSocket URL for chat
export const getChatSocketUrl = () => {
  // Properly construct base URL by removing only the /api suffix
  const baseUrl = API_BASE_URL.endsWith('/api') ? API_BASE_URL.slice(0, -4) : API_BASE_URL;
  
  console.log("WebSocket URL construction:");
  console.log("API_BASE_URL:", API_BASE_URL);
  console.log("Base URL:", baseUrl);
  
  return baseUrl;
};


export const getAdminDashboardStats = () => api.get("/admin/dashboard/stats");

// ============================
// User Profile APIs
// ============================
export const updateUserProfile = (profileData) => api.put("/user/profile", profileData);

export const getDocuments = () => {
  return api.get("/admin/documents");
};

// ============================
// Progress Tracking APIs
// ============================
export const updateVideoProgress = (progressData) => api.post("/user/video-progress", progressData);
export const getStudentProgress = () => api.get("/user/progress");
export const getWeeklyWatchTime = () => api.get("/user/progress/weekly");
export const getStudentMilestones = () => api.get("/user/milestones");
export const getRecentActivity = () => api.get("/user/activity/recent");
export const getCourseProgress = (courseId) => api.get(`/user/progress/course/${courseId}`);

// 🗑️ Delete a document
export const deleteDocument = (id) => {
  return api.delete(`/admin/documents/${id}`);
};

// 🧹 Cleanup orphaned documents
export const cleanupOrphanedDocuments = () => {
  return api.post("/admin/documents/cleanup-orphaned");
};

// ============================
// Mock Exam APIs
// ============================

// Admin Mock APIs
export const createMock = (mockData) => api.post("/mocks/create", mockData);
export const getAllMocks = () => api.get("/mocks/all");
export const getMockById = (id) => api.get(`/mocks/admin/${id}`);
export const updateMock = (id, mockData) => api.put(`/mocks/update/${id}`, mockData);
export const deleteMock = (id) => api.delete(`/mocks/delete/${id}`);
export const makeMockLive = (id) => api.patch(`/mocks/live/${id}`);
export const endMock = (id) => api.patch(`/mocks/end/${id}`);
export const getMockStatistics = (id) => api.get(`/mocks/statistics/${id}`);

// Student Mock APIs
export const getLiveMocks = () => api.get("/mocks/live");
export const getPastMocks = () => api.get("/mocks/past");
export const getMissedMocks = () => api.get("/mocks/missed");
export const startMockAttempt = (mockId) => api.post(`/mocks/start/${mockId}`);
export const submitMockAttempt = (attemptId, answers) => api.post(`/mocks/submit/${attemptId}`, answers);
export const updateFullscreenExit = (attemptId) => api.patch(`/mocks/fullscreen-exit/${attemptId}`);
export const getMockResult = (attemptId) => api.get(`/mocks/result/${attemptId}`);

// ============================
// Payment Approval APIs
// ============================
export const getPendingApprovals = () => api.get("/admin/pending-approvals");
export const approvePayment = (userId, approvalId) => api.post(`/admin/approve-payment/${userId}/${approvalId}`);
export const rejectPayment = (userId, approvalId, reason) => api.post(`/admin/reject-payment/${userId}/${approvalId}`, { reason });

// ============================
// Notification APIs
// ============================
export const getNotifications = () => api.get("/user/notifications");
export const markNotificationsRead = (notificationIds) => api.post("/user/notifications/mark-read", { notificationIds });