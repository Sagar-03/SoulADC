import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaFileAlt, FaFilePdf } from "react-icons/fa";
import StudentLayout from "../StudentLayout";
import { api, getStreamUrl } from "../../../Api/api";
import "./StudentDocuments.css";

const StudentDocuments = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [selectedModule, setSelectedModule] = useState(1);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        setError("No course ID provided");
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get(`/user/courses/${courseId}`);
        setCourse(data);

        // Set initial module
        if (data.weeks && data.weeks.length > 0) {
          setSelectedModule(data.weeks[0].weekNumber);
        }
      } catch (err) {
        console.error("Error fetching course:", err);
        if (err.response?.status === 403) {
          setError("You need to purchase this course to access its content.");
        } else {
          setError(err.response?.data?.error || "Failed to load course");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // Update documents when module changes
  useEffect(() => {
    if (course && selectedModule) {
      const currentWeek = course.weeks?.find((w) => w.weekNumber === selectedModule);
      setDocuments(currentWeek?.documents || []);
    }
  }, [course, selectedModule]);

  const handleDocumentOpen = (doc) => {
    const docId = doc._id || doc.id;
    if (docId) {
      navigate(`/documents/${courseId}/view/${docId}`);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="documents-container">
          <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !course) {
    return (
      <StudentLayout>
        <div className="documents-container">
          <div className="text-center py-5">
            <h3 className="text-muted mb-3">Dcouments Not Available</h3>
            <p className="text-muted mb-4">{error || "No course data found."}</p>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="documents-container">
        {/* Header */}
        <div className="documents-header mb-4">
          <h2 className="fw-bold" style={{ color: "#5A3825" }}>
            Reading Materials
          </h2>
          <p className="text-muted">{course.title}</p>
        </div>

        <div className="row">
          {/* Module Selector Sidebar */}
          <div className="col-lg-3 mb-4">
            <div className="modules-sidebar">
              <h5 className="sidebar-title mb-3">Select Module</h5>
              <div className="modules-list">
                {course.weeks?.map((week) => (
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
                    {week.documents && week.documents.length > 0 && (
                      <span className="documents-count">
                        {week.documents.length} docs
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Documents Grid */}
          <div className="col-lg-9">
            <div className="documents-content">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="section-title">
                  MODULE {String(selectedModule).padStart(2, "0")} — Reading Materials
                </h5>
                {/* <span className="documents-count-badge">
                  {documents.length} Note {documents.length !== 1 ? "s" : ""}
                </span> */}
              </div>

              {documents.length > 0 ? (
                <div className="row g-3">
                  {documents.map((doc, index) => (
                    <div key={doc._id || index} className="col-sm-6 col-md-4 col-lg-3">
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
                        </div>

                        <button
                          className="btn btn-primary btn-sm document-button"
                          onClick={() => handleDocumentOpen(doc)}
                        >
                          View Reading Material
                        </button>
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
                      No Notes have been uploaded for Module {selectedModule} yet.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDocuments;