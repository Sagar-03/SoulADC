import React, { useEffect, useState } from "react";
import AdminLayout from "./AdminLayout";
import { getDocuments, deleteDocument, cleanupOrphanedDocuments, api } from "../../Api/api";
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
  const [currentDocument, setCurrentDocument] = useState(null);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [documentLoading, setDocumentLoading] = useState(false);

  useEffect(() => {
    fetchCourses();
    fetchDocuments(); // Fetch documents immediately on component mount
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/admin/courses');
      const coursesData = response.data?.courses || response.data || [];
      
      console.log('📚 Fetched courses:', coursesData);
      
      setCourses(coursesData);
      
      // Set first course as default if available
      if (coursesData.length > 0) {
        setSelectedCourse(coursesData[0]);
        // Check if course has weeks (direct or from shared content)
        const weeks = coursesData[0].weeks;
        if (weeks && weeks.length > 0) {
          console.log('📖 Course has', weeks.length, 'weeks/modules');
          setSelectedModule(weeks[0].weekNumber);
        } else {
          console.warn('⚠️ Course has no weeks/modules');
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
      console.log("🔄 Fetching all uploaded documents...");
      const response = await getDocuments();
      console.log("📄 Full API response:", response);
      
      // Backend returns documents directly as array
      const documentsData = Array.isArray(response.data) ? response.data : 
                           response.data?.documents || 
                           response.data?.data || 
                           [];
      
      console.log(`✅ Documents fetched: ${documentsData.length}`, documentsData);
      
      // Log sample document structure if any exist
      if (documentsData.length > 0) {
        console.log("📋 Sample document structure:", documentsData[0]);
      }
      
      setDocuments(documentsData);
    } catch (err) {
      console.error("❌ Error loading documents:", err);
      console.error("🔍 Error details:", {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        url: err.config?.url
      });
      
      // Set empty array on error to prevent undefined issues
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  // No need to fetch documents when course changes since we fetch all documents upfront

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this document?")) return;
    
    const docToDelete = documents.find(doc => doc._id === id);
    console.log("🗑️ Attempting to delete document:", {
      id,
      title: docToDelete?.title,
      totalDocsBefore: documents.length
    });
    
    try {
      await deleteDocument(id);
      
      // Update state to remove the deleted document
      setDocuments((prev) => {
        const updated = prev.filter((doc) => doc._id !== id);
        console.log("✅ Document deleted from state:", {
          deletedTitle: docToDelete?.title,
          remainingDocs: updated.length,
          totalDocsBefore: prev.length
        });
        return updated;
      });
      
      alert("🗑️ Document deleted successfully!");
    } catch (err) {
      console.error("❌ Delete failed:", err);
      alert("Failed to delete document: " + (err.response?.data?.error || err.message));
    }
  };

  const handleCleanupOrphaned = async () => {
    if (!window.confirm("🧹 This will remove all document entries whose files no longer exist in S3. Continue?")) {
      return;
    }

    try {
      setLoading(true);
      console.log("🧹 Starting cleanup of orphaned documents...");
      
      const response = await cleanupOrphanedDocuments();
      const { stats } = response.data;
      
      console.log("✅ Cleanup complete:", stats);
      
      // Refresh documents list
      await fetchDocuments();
      
      alert(`🧹 Cleanup complete!\n\nChecked: ${stats.totalChecked} documents\nRemoved: ${stats.totalRemoved} orphaned entries\n\nThe page will now refresh.`);
      
      // Refresh the page to show updated list
      window.location.reload();
    } catch (err) {
      console.error("❌ Cleanup failed:", err);
      alert("Failed to cleanup orphaned documents: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
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
    if (!selectedCourse || !documents.length) {
      console.log("No course selected or no documents available:", { selectedCourse, documentsLength: documents.length });
      return [];
    }
    
    console.log("Filtering documents for:", { 
      courseId: selectedCourse._id, 
      courseTitle: selectedCourse.title, 
      selectedModule,
      totalDocuments: documents.length
    });
    
    const filtered = documents.filter(doc => {
      // Filter by course - backend uses courseTitle
      const matchesCourse = doc.courseTitle === selectedCourse.title;
      
      // Filter by module/week - use weekNumber for more reliable matching
      const matchesModule = doc.weekNumber === selectedModule;
      
      console.log(`Document ${doc.title}:`, {
        courseMatch: matchesCourse,
        moduleMatch: matchesModule,
        docCourseTitle: doc.courseTitle,
        selectedCourseTitle: selectedCourse.title,
        docWeekNumber: doc.weekNumber,
        docWeekTitle: doc.weekTitle,
        selectedModule
      });
      
      return matchesCourse && matchesModule;
    });
    
    console.log("Filtered documents:", filtered);
    return filtered;
  };

  const handleCourseChange = (course) => {
    console.log('📖 Switching to course:', course.title);
    setSelectedCourse(course);
    // Reset to first module of the selected course
    const weeks = course.weeks;
    if (weeks && weeks.length > 0) {
      console.log('✅ Course has', weeks.length, 'weeks/modules');
      setSelectedModule(weeks[0].weekNumber);
    } else {
      console.warn('⚠️ Course has no weeks/modules');
      setSelectedModule(null);
    }
  };

  const handleDocumentView = (doc) => {
    console.log("📄 Opening document:", doc);
    
    // Check if document has a valid URL
    if (!doc.url && !doc.s3Key) {
      alert("❌ Document URL not available. Please contact support.");
      return;
    }

    // Construct the full URL if needed
    let documentUrl = doc.url;
    if (!documentUrl && doc.s3Key) {
      // Fallback to construct URL from s3Key
      documentUrl = `/api/stream/${doc.s3Key}`;
    }

    // Ensure the URL is absolute
    if (documentUrl && !documentUrl.startsWith('http')) {
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:7001';
      documentUrl = baseUrl.replace('/api', '') + documentUrl;
    }

    console.log("🔗 Document URL:", documentUrl);
    setCurrentDocument(doc);
    setDocumentLoading(true);
    setPreviewUrl(documentUrl);
  };

  const filteredDocuments = getFilteredDocuments();

  return (
    <AdminLayout>
      <div className="documents-container">
        {/* Header */}
        <div className="documents-header mb-4 d-flex justify-content-between align-items-start">
          <div>
            <h2 className="fw-bold" style={{ color: "#5A3825" }}>
              Manage Notes & Mock Papers
            </h2>
            <p className="text-muted mb-0">Organize and manage course Notes by modules</p>
          </div>
          <button
            className="btn btn-warning"
            onClick={handleCleanupOrphaned}
            disabled={loading}
            title="Remove document entries whose files don't exist in S3"
          >
            🧹 Cleanup Orphaned Docs
          </button>
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
            <p className="text-muted">No courses are available to manage Notes.</p>
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
                        doc.courseTitle === course.title
                      ).length;
                      return (
                        <option key={course._id} value={course._id}>
                          {course.title} {loading ? '' : `(${courseDocsCount} documents)`}
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
                          <span>Total Notes:</span>
                          <span className="stat-value">
                            {loading ? '...' : documents.filter(doc => 
                              doc.courseTitle === selectedCourse.title
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
                          doc.courseTitle === selectedCourse.title &&
                          doc.weekTitle === week.title
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
                        MODULE {String(selectedModule).padStart(2, "0")} — Notes / Papers
                      </h5>
                      <span className="documents-count-badge">
                        {filteredDocuments.length} Notes{filteredDocuments.length !== 1 ? "s" : ""}
                      </span>
                    </div>

                    {loading ? (
                      <div className="text-center py-5">
                        <div className="spinner-border text-primary" role="status">
                          <span className="visually-hidden">Loading Notes...</span>
                        </div>
                        <p className="text-muted mt-3">Loading Notes...</p>
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
                                  {/* <button
                                    className="btn btn-primary btn-sm document-button flex-fill"
                                    onClick={() => handleDocumentView(doc)}
                                  >
                                    👁️ View
                                  </button> */}
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
                          <h5 className="text-muted">No Notes Available</h5>
                          <p className="text-muted">
                            No Notes have been uploaded for Module {selectedModule} of {selectedCourse.title} yet.
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
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setPreviewUrl("");
            }
          }}
        >
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <div>
                  <h5 className="modal-title mb-1">📄 Document Viewer</h5>
                  {currentDocument && (
                    <small className="text-muted">
                      {currentDocument.title} • {currentDocument.type?.toUpperCase() || 'PDF'}
                    </small>
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-outline-primary btn-sm"
                    onClick={() => window.open(previewUrl, '_blank')}
                    title="Open in new tab"
                  >
                    🔗 Open in New Tab
                  </button>
                  <a
                    href={previewUrl}
                    download={currentDocument?.title || 'document'}
                    className="btn btn-outline-success btn-sm"
                    title="Download document"
                  >
                    💾 Download
                  </a>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => {
                      setPreviewUrl("");
                      setCurrentDocument(null);
                    }}
                    title="Close"
                  ></button>
                </div>
              </div>
              <div className="modal-body p-0" style={{ height: "80vh" }}>
                {currentDocument?.type === 'pdf' || currentDocument?.title?.toLowerCase().includes('.pdf') ? (
                  <iframe
                    src={previewUrl}
                    width="100%"
                    height="100%"
                    title="Document Preview"
                    style={{
                      border: "none",
                      borderRadius: "0 0 0.375rem 0.375rem"
                    }}
                    onLoad={() => console.log("📄 PDF loaded successfully")}
                    onError={(e) => {
                      console.error("❌ Error loading PDF:", e);
                    }}
                  ></iframe>
                ) : (
                  <div className="d-flex flex-column align-items-center justify-content-center h-100 p-4">
                    <div className="text-center">
                      <div className="mb-4" style={{ fontSize: "4rem" }}>
                        {currentDocument?.type === 'doc' || currentDocument?.type === 'docx' ? '📝' :
                         currentDocument?.type === 'xls' || currentDocument?.type === 'xlsx' ? '📊' :
                         currentDocument?.type === 'ppt' || currentDocument?.type === 'pptx' ? '📽️' :
                         '📄'}
                      </div>
                      <h5 className="mb-3">{currentDocument?.title}</h5>
                      <p className="text-muted mb-4">
                        This {currentDocument?.type?.toUpperCase() || 'document'} cannot be previewed directly in the browser.
                      </p>
                      <div className="d-flex gap-3 justify-content-center">
                        <button
                          className="btn btn-primary"
                          onClick={() => window.open(previewUrl, '_blank')}
                        >
                          🔗 Open in New Tab
                        </button>
                        <a
                          href={previewUrl}
                          download={currentDocument?.title || 'document'}
                          className="btn btn-success"
                        >
                          💾 Download
                        </a>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default AdminDocuments;
