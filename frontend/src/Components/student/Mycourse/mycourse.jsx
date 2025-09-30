import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./mycourse.css";
import StudentLayout from "../StudentaLayout";

// Static data for fallback
const staticWeeks = Array.from({ length: 7 }, (_, w) => ({
  week: w + 1,
  days: [
    { type: "Video", title: `Day 1: Lesson ${w + 1}.1` },
    { type: "Video", title: `Day 2: Lesson ${w + 1}.2` },
    { type: "Video", title: `Day 3: Lesson ${w + 1}.3` },
    { type: "Video", title: `Day 4: Lesson ${w + 1}.4` },
    { type: "Video", title: `Day 5: Lesson ${w + 1}.5` },
    { type: "Quiz", title: `Day 6: Practice Quiz ${w + 1}` },
    { type: "Mock", title: `Day 7: Mock Test ${w + 1}` },
  ],
}));

const documents = [
  { title: "ADC Part-1 Mock Paper 01", tag: "PDF" },
  { title: "ADC Part-1 Mock Paper 02", tag: "PDF" },
  { title: "Therapeutics: High-Yield Notes", tag: "DOC" },
  { title: "Clinical Units – Quick Guide", tag: "PDF" },
];

const Mycourse = () => {
  const { courseId } = useParams(); // Get course ID from URL
  const navigate = useNavigate();
  const [tab, setTab] = useState("content"); // "content" | "documents"
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeDay, setActiveDay] = useState(0); // 0 = Day 1
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch course data from backend
  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) {
        // If no courseId, use static data
        setCourse({ 
          title: "ADC Part 1 Course", 
          weeks: staticWeeks.map(w => ({
            weekNumber: w.week,
            title: `Week ${w.week} Content`,
            days: w.days.map((day, index) => ({
              dayNumber: index + 1,
              title: day.title,
              contents: [{
                type: day.type.toLowerCase(),
                title: day.title,
                s3Key: `sample-${day.type.toLowerCase()}-${w.week}-${index + 1}`
              }]
            }))
          }))
        });
        setLoading(false);
        return;
      }

      try {
        // Fetch course data with weeks and content
        const res = await fetch(`http://localhost:7001/api/user/courses/${courseId}`);
        if (!res.ok) {
          throw new Error("Failed to fetch course data");
        }
        const courseData = await res.json();
        setCourse(courseData);
      } catch (err) {
        console.error("Error fetching course:", err);
        setError(err.message);
        // Fallback to static data
        setCourse({ 
          title: "ADC Part 1 Course", 
          weeks: staticWeeks.map(w => ({
            weekNumber: w.week,
            title: `Week ${w.week} Content`,
            days: w.days.map((day, index) => ({
              dayNumber: index + 1,
              title: day.title,
              contents: [{
                type: day.type.toLowerCase(),
                title: day.title,
                s3Key: `sample-${day.type.toLowerCase()}-${w.week}-${index + 1}`
              }]
            }))
          }))
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  // Handle content opening
  const handleOpenContent = async (content) => {
    if (content.type === "video") {
      // Navigate to the dedicated video player page
      const videoId = content._id || content.s3Key;
      navigate(`/student/course/${courseId}/video/${videoId}`);
    } else if (content.type === "pdf" || content.type === "document") {
      // Open document in new tab
      const docId = content._id || content.s3Key;
      window.open(`http://localhost:7001/api/stream/${docId}`, '_blank');
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

  return (
    <StudentLayout>
      <div className="course-page">
        {/* Banner */}
        <div className="container">
          <div className="banner text-white text-center py-5 mb-4">
            <h1 className="fw-bold mb-1">{course?.title || "Course Content"}</h1>
            <p className="mb-0">{course?.weeks?.length || 0}-Week comprehensive plan with expert guidance</p>
            {error && (
              <div className="alert alert-warning mt-3" role="alert">
                <small>⚠️ Using demo data. {error}</small>
              </div>
            )}
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
                      className={`list-group-item list-group-item-action ${
                        selectedWeek === week.weekNumber ? "active" : ""
                      }`}
                      onClick={() => {
                        setSelectedWeek(week.weekNumber);
                        setActiveDay(0); // reset to Day 1 when switching week
                      }}
                    >
                      WEEK {String(week.weekNumber).padStart(2, "0")} - {week.title || "Study Plan"}
                    </button>
                  )) || (
                    <div className="text-center p-4">
                      <p className="text-muted">No weeks available</p>
                    </div>
                  )}
                </div>
              </aside>

              {/* Center: Days list */}
              <main className="col-lg-9">
                <h5 className="section-heading mb-3">
                  Week {selectedWeek} — Study Plan
                </h5>

                <div className="days-list">
                  {course?.weeks
                    ?.find(w => w.weekNumber === selectedWeek)
                    ?.days?.map((day, dayIndex) => (
                    <div
                      key={day._id || dayIndex}
                      className={`content-row ${activeDay === dayIndex ? "active" : ""}`}
                      onClick={() => setActiveDay(dayIndex)}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className="type-chip day">
                          Day {day.dayNumber}
                        </span>
                        <span className="title">{day.title}</span>
                        <span className="badge bg-secondary">
                          {day.contents?.length || 0} items
                        </span>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        {day.contents?.map((content, contentIndex) => (
                          <button 
                            key={content._id || contentIndex}
                            className={`btn btn-sm btn-outline-${content.type === 'video' ? 'primary' : 'info'}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenContent(content);
                            }}
                            title={`Open ${content.title || content.type}`}
                          >
                            {content.type === 'video' ? '🎬' : '📄'} {content.type}
                          </button>
                        )) || (
                          <span className="text-muted small">No content</span>
                        )}
                      </div>
                    </div>
                  )) || (
                    <div className="text-center p-4">
                      <p className="text-muted">No content available for this week</p>
                    </div>
                  )}
                </div>
              </main>
            </div>
          )}

          {/* TAB: Documents / Mock Papers */}
          {tab === "documents" && (
            <div className="row g-3">
              {documents.map((d, i) => (
                <div key={i} className="col-md-6 col-lg-4">
                  <div className="doc-card">
                    <div className="doc-icon">📄</div>
                    <div className="doc-meta">
                      <div className="doc-title">{d.title}</div>
                      <span className="doc-tag">{d.tag}</span>
                    </div>
                    <button className="btn btn-sm btn-outline-dark">View</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>


    </StudentLayout>
  );
};

export default Mycourse;
