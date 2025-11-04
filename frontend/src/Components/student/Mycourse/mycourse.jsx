import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./mycourse.css";
import StudentLayout from "../StudentLayout";
import { getStreamUrl } from "../../../Api/api";
import { api } from "../../../Api/api";

const Mycourse = () => {
  const { courseId } = useParams(); // Get course ID from URL
  const navigate = useNavigate();

  const [tab, setTab] = useState("content"); // "content" | "documents"
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeDay, setActiveDay] = useState(0); // 0 = Day 1
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedWeekDocs, setSelectedWeekDocs] = useState([]);

  // Fetch course data from backend
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
      } catch (err) {
        console.error("Error fetching course:", err);
        if (err.response?.status === 403) {
          setError(
            "You need to purchase this course to access its content. Please visit the courses page to purchase."
          );
        } else {
          setError(err.response?.data?.error || err.message || "Failed to load course");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // Fetch week-level documents when course or selectedWeek changes
  useEffect(() => {
    if (course && selectedWeek) {
      const currentWeek = course.weeks?.find((w) => w.weekNumber === selectedWeek);
      setSelectedWeekDocs(currentWeek?.documents || []);
    }
  }, [course, selectedWeek]);

  // Handle content opening
  const handleOpenContent = (content) => {
    if (content.type === "video") {
      const videoId = content._id || content.s3Key;
      navigate(`/student/course/${courseId}/video/${videoId}`);
    } else if (content.type === "pdf" || content.type === "document") {
      const docId = content._id || content.s3Key;
      window.open(getStreamUrl(docId), "_blank");
    } else {
      alert(`Opening ${content.type}: ${content.title}`);
    }
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </StudentLayout>
    );
  }

  if (error || !course) {
    const isAccessDenied = error && error.includes("purchase this course");

    return (
      <StudentLayout>
        <div className="container">
          <div className="text-center py-5">
            <h3 className="text-muted mb-3">
              {isAccessDenied ? "Course Access Restricted" : "Course Not Available"}
            </h3>
            <p className="text-muted mb-4">
              {error || "No course data found. Please check the course ID or try again later."}
            </p>
            <div className="d-flex gap-3 justify-content-center">
              <button
                className="btn btn-primary"
                onClick={() => navigate("/student/dashboard")}
              >
                Back to Dashboard
              </button>
              {isAccessDenied && (
                <button
                  className="btn btn-outline-primary"
                  onClick={() => navigate("/courses")}
                >
                  Browse Courses
                </button>
              )}
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="course-page">
        {/* Banner */}
        <div className="container">
          <div className="banner text-white text-center py-5 mb-4">
            <h1 className="fw-bold mb-1">{course?.title || "Course Content"}</h1>
            <p className="mb-0">{course?.weeks?.length || 0}-Modules comprehensive plan with expert guidance</p>
          </div>
        </div>

        {/* Switch Tabs */}
        <div className="container">
          <ul className="nav nav-pills switch-tabs mb-4" role="tablist">
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${tab === "content" ? "active" : ""}`}
                onClick={() => setTab("content")}
                type="button"
                role="tab"
              >
                Course Content
              </button>
            </li>
            <li className="nav-item" role="presentation">
              <button
                className={`nav-link ${tab === "documents" ? "active" : ""}`}
                onClick={() => setTab("documents")}
                type="button"
                role="tab"
              >
                Documents / Mock Papers
              </button>
            </li>
          </ul>

          {/* TAB: Course Content */}
          {tab === "content" && (
            <div className="row g-4">
              {/* Left rail: Weeks list */}
              <aside className="col-lg-3">
                <div className="weeks-list list-group">
                  {course?.weeks?.map((week, index) => (
                    <button
                      key={week._id || index}
                      className={`list-group-item list-group-item-action ${selectedWeek === week.weekNumber ? "active" : ""
                        }`}
                      onClick={() => {
                        setSelectedWeek(week.weekNumber);
                        setActiveDay(0); // reset to Day 1 when switching week
                      }}
                    >
                      MODULE {String(week.weekNumber).padStart(2, "0")} - {week.title || "Study Plan"}
                    </button>
                  )) || (
                      <div className="text-center p-4">
                        <p className="text-muted">No Modules available</p>
                      </div>
                    )}
                </div>
              </aside>

              {/* Center: Days list */}
              <main className="col-lg-9">
                <h5 className="section-heading mb-3">Module {selectedWeek} — Study Plan</h5>

                <div className="days-list">
                  {course?.weeks
                    ?.find((w) => w.weekNumber === selectedWeek)
                    ?.days?.map((day, dayIndex) => (
                      <div
                        key={day._id || dayIndex}
                        className={`content-row ${activeDay === dayIndex ? "active" : ""}`}
                        onClick={() => setActiveDay(dayIndex)}
                      >
                        <div className="d-flex align-items-center gap-3">
                          <span className="type-chip day">
                            {selectedWeek}.{day.dayNumber}
                          </span>
                          <span className="badge bg-secondary">
                            {day.contents?.length || 0} items
                          </span>
                        </div>

                        <div className="d-flex align-items-center gap-2">
                          {day.contents?.map((content, contentIndex) => (
                            <button
                              key={content._id || contentIndex}
                              className={`btn btn-sm btn-outline-${content.type === "video" ? "primary" : "info"
                                }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenContent(content);
                              }}
                              title={`Open ${content.title || content.type}`}
                            >
                              {content.type === "video" ? "🎬" : "📄"} {content.type}
                            </button>
                          )) || <span className="text-muted small">No content</span>}
                        </div>
                      </div>
                    )) || (
                      <div className="text-center p-4">
                        <p className="text-muted">No content available for this Module</p>
                      </div>
                    )}
                </div>
              </main>
            </div>
          )}

          {/* TAB: Documents / Mock Papers */}
          {tab === "documents" && (
            <div className="row g-3">
              {selectedWeekDocs.length > 0 ? (
                selectedWeekDocs.map((doc, i) => (
                  <div key={i} className="col-sm-6 col-md-4 col-lg-3">
                    <div className="doc-card shadow-sm p-3 h-100 d-flex flex-column justify-content-between">
                      <div className="d-flex align-items-start mb-2">
                        <div className="doc-icon me-2">📄</div>
                        <div className="flex-grow-1">
                          <div className="doc-title" title={doc.title}>
                            {doc.title}
                          </div>
                          <span className="doc-tag badge bg-light text-dark">
                            {doc.type?.toUpperCase() || "PDF"}
                          </span>
                        </div>
                      </div>

                      <button
                        className="btn btn-outline-primary btn-sm mt-2 w-100"
                        onClick={() => window.open(getStreamUrl(doc.s3Key), "_blank")}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted py-4">
                  <i className="bi bi-info-circle me-2"></i>
                  No documents uploaded for this module yet.
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </StudentLayout>
  );
};

export default Mycourse;
