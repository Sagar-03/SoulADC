import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getDocuments, deleteDocument, api } from "../../Api/api";
import { FaFileAlt, FaFilePdf } from "react-icons/fa";
import "../student/Documents/StudentDocuments.css";
import "./AdminDocuments.css";
import "../student/Dashboard/dashboard.css";

const AdminDocuments = () => {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(1);
  const [documents, setDocuments] = useState([]);
  const [previewUrl, setPreviewUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/admin/courses');
      const coursesData = response.data?.courses || response.data || [];
      setCourses(coursesData);
      
      // Set first course as default if available
      if (coursesData.length > 0) {
        setSelectedCourse(coursesData[0]);
        if (coursesData[0].weeks && coursesData[0].weeks.length > 0) {
          setSelectedModule(coursesData[0].weeks[0].weekNumber);
        }
      }
    } catch (err) {
      console.error("Error loading courses:", err);
    } finally {
      setCoursesLoading(false);
    }
  };

  const fetchDocuments = async () => {
    try {
      console.log("Fetching all uploaded documents...");
      const response = await getDocuments();
      console.log("Full API response:", response);
      
      const documentsData = response.data?.documents || response.data || [];
      console.log(`Documents fetched: ${documentsData.length}`, documentsData);
      
      setDocuments(documentsData);
    } catch (err) {
      console.error("Error loading documents:", err);
      console.error("Error details:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch documents when course is selected
  useEffect(() => {
    if (selectedCourse) {
      fetchDocuments();
    }
  }, [selectedCourse]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    try {
      await deleteDocument(id);
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
      alert("🗑️ Document deleted successfully!");
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete document.");
    }
  };

  const getDocumentIcon = (type) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📃';
      case 'xls':
      case 'xlsx':
        return '📊';
      case 'ppt':
      case 'pptx':
        return '📽️';
      default:
        return '📄';
    }
  };

  // Filter documents by selected course and module
  const getFilteredDocuments = () => {
    if (!selectedCourse || !documents.length) return [];
    
    return documents.filter(doc => {
      // Filter by course
      const matchesCourse = doc.courseId === selectedCourse._id || 
                           doc.courseTitle === selectedCourse.title;
      
      // Filter by module/week
      const matchesModule = doc.weekNumber === selectedModule ||
                           (doc.weekTitle && doc.weekTitle.includes(`${selectedModule}`));
      
      return matchesCourse && matchesModule;
    });
  };

  const handleCourseChange = (course) => {
    setSelectedCourse(course);
    // Reset to first module of the selected course
    if (course.weeks && course.weeks.length > 0) {
      setSelectedModule(course.weeks[0].weekNumber);
    }
  };

  const filteredDocuments = getFilteredDocuments();

  return (
    <AdminLayout>
      <div className="documents-container">
        {/* Header */}
        <div className="documents-header mb-4">
          <h2 className="fw-bold" style={{ color: "#5A3825" }}>
            Manage Documents & Mock Papers
          </h2>
          <p className="text-muted">Organize and manage course documents by modules</p>
        </div>

        {coursesLoading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading courses...</span>
            </div>
            <p className="text-muted mt-3">Loading courses...</p>
          </div>
        ) : courses.length === 0 ? (
          <div className="text-center py-5">
            <h4 className="text-muted">📚 No Courses Found</h4>
            <p className="text-muted">No courses are available to manage documents.</p>
          </div>
        ) : (
          <>
            {/* Course Selector */}
            <div className="admin-course-selector mb-4">
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label fw-bold">
                    Select Course
                  </label>
                  <select 
                    className="form-select"
                    value={selectedCourse?._id || ''}
                    onChange={(e) => {
                      const course = courses.find(c => c._id === e.target.value);
                      handleCourseChange(course);
                    }}
                  >
                    {courses.map(course => {
                      const courseDocsCount = documents.filter(doc => 
                        doc.courseId === course._id || doc.courseTitle === course.title
                      ).length;
                      return (
                        <option key={course._id} value={course._id}>
                          {course.title} ({courseDocsCount} documents)
                        </option>
                      );
                    })}
                  </select>
                </div>
                <div className="col-md-6">
                  {selectedCourse && (
                    <div className="admin-module-stats">
                      <h6>Course Summary</h6>
                      <div className="stats-row">
                        <div className="stat-item">
                          <span>Total Modules:</span>
                          <span className="stat-value">{selectedCourse.weeks?.length || 0}</span>
                        </div>
                        <div className="stat-item">
                          <span>Total Documents:</span>
                          <span className="stat-value">
                            {documents.filter(doc => 
                              doc.courseId === selectedCourse._id || doc.courseTitle === selectedCourse.title
                            ).length}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {selectedCourse && (
              <div className="row">
                {/* Module Selector Sidebar */}
                <div className="col-lg-3 mb-4">
                  <div className="modules-sidebar">
                    <h5 className="sidebar-title mb-3">Select Module</h5>
                    <div className="modules-list">
                      {selectedCourse.weeks?.map((week) => {
                        const weekDocuments = documents.filter(doc => 
                          (doc.courseId === selectedCourse._id || doc.courseTitle === selectedCourse.title) &&
                          (doc.weekNumber === week.weekNumber || (doc.weekTitle && doc.weekTitle.includes(`${week.weekNumber}`)))
                        );
                        
                        return (
                          <button
                            key={week._id || week.weekNumber}
                            className={`module-button ${
                              selectedModule === week.weekNumber ? "active" : ""
                            }`}
                            onClick={() => setSelectedModule(week.weekNumber)}
                          >
                            <span className="module-number">
                              MODULE {String(week.weekNumber).padStart(2, "0")}
                            </span>
                            <span className="module-title">
                              {week.title || "Study Plan"}
                            </span>
                            {weekDocuments.length > 0 && (
                              <span className="documents-count">
                                {weekDocuments.length} docs
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Documents Grid */}
                <div className="col-lg-9">
                  <div className="documents-content">
                    <div className="d-flex justify-content-between align-items-center mb-3">
                      <h5 className="section-title">
                        MODULE {String(selectedModule).padStart(2, "0")} — Documents
                      </h5>
                      <span className="documents-count-badge">
                        {filteredDocuments.length} document{filteredDocuments.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading documents...</span>
                        </div>
                        <p className="text-muted mt-3">Loading documents...</p>
                      </div>
                    ) : filteredDocuments.length > 0 ? (
                      <div className="row g-3">
                        {filteredDocuments.map((doc) => (
                          <div key={doc._id} className="col-sm-6 col-md-4 col-lg-3">
                            <div className="admin-document-card">
                              <div className="document-card">
                                <div className="document-icon">
                                  {doc.type === "pdf" || doc.title?.toLowerCase().includes("pdf") ? (
                                    <FaFilePdf className="pdf-icon" />
                                  ) : (
                                    <FaFileAlt className="doc-icon" />
                                  )}
                                </div>
                                
                                <div className="document-info">
                                  <h6 className="document-title" title={doc.title}>
                                    {doc.title}
                                  </h6>
                                  <span className="document-type">
                                    {doc.type?.toUpperCase() || "PDF"}
                                  </span>
                                  
                                  <div className="upload-info">
                                    <small>
                                      <strong>📅 Uploaded:</strong> {new Date(doc.createdAt).toLocaleDateString()}
                                    </small>
                                    <small>
                                      <strong>👤 By:</strong> {doc.uploadedBy?.name || "Admin"}
                                    </small>
                                    {doc.dayTitle && (
                                      <small>
                                        <strong>📚 Day:</strong> {doc.dayTitle}
                                      </small>
                                    )}
                                  </div>
                                </div>

                                <div className="admin-actions">
                                  <button
                                    className="btn btn-primary btn-sm document-button flex-fill"
                                    onClick={() => setPreviewUrl(doc.url)}
                                  >
                                    👁️ View
                                  </button>
                                  <button
                                    className="admin-delete-btn"
                                    onClick={() => handleDelete(doc._id)}
                                    title="Delete Document"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="no-documents">
                        <div className="text-center py-5">
                          <FaFileAlt className="no-docs-icon mb-3" />
                          <h5 className="text-muted">No Documents Available</h5>
                          <p className="text-muted">
                            No documents have been uploaded for Module {selectedModule} of {selectedCourse.title} yet.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Document Preview Modal */}
      {previewUrl && (
        <div
          className="modal fade show"
          style={{ display: "block", background: "rgba(0,0,0,0.5)" }}
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Document Viewer</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setPreviewUrl("")}
                ></button>
              </div>
              <div className="modal-body" style={{ height: "80vh" }}>
                <iframe
                  src={previewUrl}
                  width="100%"
                  height="100%"
                  title="Document Preview"
                  style={{
                    border: "none",
                    pointerEvents: "none", // disable download/right-click
                  }}
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDocuments;
