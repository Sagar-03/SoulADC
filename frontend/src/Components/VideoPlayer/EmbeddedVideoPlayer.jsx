import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./EmbeddedVideoPlayer.css";
import StudentLayout from "../student/StudentLayout";
import { api, getVideoMetadata, getStreamUrl } from "../../Api/api";

const EmbeddedVideoPlayer = () => {
  const { courseId, videoId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [videoTitle, setVideoTitle] = useState("");
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Keep course across video switches — only refetch when courseId changes
  const courseRef = useRef(null);
  const lastCourseId = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      // Reset per-video state immediately so stale values don't flash
      setVideoTitle("");
      setError(null);
      setSelectedWeek(null);
      setLoading(true);

      try {
        // Only fetch course if courseId changed
        let courseData = courseRef.current;
        if (courseId !== lastCourseId.current) {
          const res = await api.get(`/user/courses/${courseId}`);
          courseData = res.data;
          courseRef.current = courseData;
          lastCourseId.current = courseId;
          setCourse(courseData);
        }

        // Find title + active week from course structure
        let title = "Video Lesson";
        let foundWeek = null;

        if (videoId && courseData) {
          outer: for (const week of courseData.weeks || []) {
            for (const day of week.days || []) {
              for (const content of day.contents || []) {
                if (
                  content.type === "video" &&
                  (String(content._id) === String(videoId) || content.asset_id === videoId)
                ) {
                  title = content.title || "Video Lesson";
                  foundWeek = week.weekNumber;
                  break outer;
                }
              }
            }
          }
          if (!foundWeek && courseData.weeks?.length > 0) {
            foundWeek = courseData.weeks[0].weekNumber;
          }
        }

        setVideoTitle(title);
        setSelectedWeek(foundWeek);

        // Fetch metadata for title override (non-blocking)
        if (videoId) {
          getVideoMetadata(videoId)
            .then((res) => {
              const meta = res.data;
              if (meta?.title && meta.title !== "Video") setVideoTitle(meta.title);
            })
            .catch(() => {});
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [courseId, videoId]);

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handleOpenContent = (content) => {
    if (content.type === "video") {
      if (!content.asset_id) return;
      navigate(`/student/course/${courseId}/video/${content.asset_id}`);
    } else if (content.type === "pdf" || content.type === "document") {
      window.open(getStreamUrl(content._id || content.s3Key), "_blank");
    }
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <StudentLayout>
      <div className="video-player-page" style={{ userSelect: "none" }}>
        <div className="container-fluid px-4">

          {/* Header */}
          <div className="video-header d-flex justify-content-between align-items-center mb-4">
            <div style={{ flex: 1, maxWidth: "70%" }}>
              <button
                className="btn btn-outline-secondary me-3"
                onClick={() => navigate(`/student/course/${courseId}`)}
              >
                ← Back to Course
              </button>
              <h4 className="mb-0" style={{ display: "inline-block", maxWidth: "calc(100% - 150px)" }}>
                {videoTitle || "Loading..."}
              </h4>
            </div>
            <div className="course-info">
              <small className="text-muted">{course?.title || ""}</small>
            </div>
          </div>

          {error && (
            <div className="alert alert-warning mb-4" role="alert">
              <small>{error}</small>
            </div>
          )}

          <div className="row g-4">
            {/* Video */}
            <div className="col-lg-8">
              <div className="video-container">
                <div className="video-wrapper" style={{ position: "relative" }}>
                  {loading ? (
                    <div style={{
                      width: "100%", height: "450px", backgroundColor: "#1a1a1a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      borderRadius: "8px",
                    }}>
                      <div style={{ textAlign: "center", color: "#fff" }}>
                        <div
                          className="spinner-border text-light mb-3"
                          role="status"
                          style={{ width: "3rem", height: "3rem" }}
                        >
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <div style={{ fontSize: "14px", opacity: 0.7 }}>Loading video...</div>
                      </div>
                    </div>
                  ) : videoId ? (
                    <div style={{ position: "relative", paddingTop: "56.25%" }}>
                      <iframe
                        key={videoId}
                        src={`https://play.gumlet.io/embed/${videoId}?preload=true`}
                        title={videoTitle || "Video"}
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
                        allowFullScreen
                        style={{
                          border: "none",
                          position: "absolute",
                          top: 0, left: 0,
                          width: "100%", height: "100%",
                        }}
                      />
                    </div>
                  ) : (
                    <div style={{
                      width: "100%", height: "450px", backgroundColor: "#1a1a1a",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexDirection: "column", borderRadius: "8px", color: "#fff",
                    }}>
                      <div style={{ fontSize: "18px", fontWeight: "500" }}>Video not found</div>
                    </div>
                  )}
                </div>

                {!loading && videoTitle && (
                  <div className="video-info mt-3">
                    <h5>{videoTitle}</h5>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="col-lg-4">
              <div className="course-sidebar">
                <h6 className="sidebar-title mb-3">Course Content</h6>

                {selectedWeek && course?.weeks?.length > 0 && (
                  <div className="progress-info mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <small>Progress</small>
                      <small>Week {selectedWeek} of {course.weeks.length}</small>
                    </div>
                    <div className="progress">
                      <div
                        className="progress-bar"
                        style={{ width: `${(selectedWeek / course.weeks.length) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="weeks-accordion">
                  {course?.weeks?.map((week, index) => (
                    <div key={week._id || index} className="week-item mb-3">
                      <div
                        className={`week-header ${selectedWeek === week.weekNumber ? "active" : ""}`}
                        onClick={() => setSelectedWeek(week.weekNumber)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="week-title">Module {week.weekNumber}</span>
                          <span className="week-toggle">{selectedWeek === week.weekNumber ? "−" : "+"}</span>
                        </div>
                        <div className="week-subtitle">{week.title || "Study Plan"}</div>
                      </div>

                      {selectedWeek === week.weekNumber && (
                        <div className="week-content">
                          {week.days?.map((day, dayIndex) => (
                            <div key={day._id || dayIndex} className="day-item">
                              <div className="day-header">
                                <small className="day-number">{day.dayNumber}</small>
                              </div>
                              <div className="day-contents">
                                {day.contents?.map((content, contentIndex) => {
                                  const isActive = content.type === "video"
                                    ? content.asset_id === videoId
                                    : String(content._id) === String(videoId);
                                  return (
                                    <button
                                      key={content._id || contentIndex}
                                      className={`content-btn ${isActive ? "active" : ""} ${content.type === "video" ? "video" : "document"}`}
                                      onClick={() => handleOpenContent(content)}
                                      title={content.title || content.type}
                                    >
                                      <span className="content-icon">
                                        {content.type === "video" ? "🎬" : "📄"}
                                      </span>
                                      <span className="content-title" style={{
                                        fontSize: "0.75rem", fontWeight: "500",
                                        overflow: "hidden", textOverflow: "ellipsis",
                                        whiteSpace: "nowrap", maxWidth: "200px",
                                        display: "inline-block",
                                      }}>
                                        {content.title || content.type}
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default EmbeddedVideoPlayer;
