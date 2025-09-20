import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";

const ManageCourses = () => {
  /** ----------------------------------------------------
   * 1. HARDCODED DATA
   * ---------------------------------------------------- */
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: "5 Month Course",
      duration: "20 Weeks",
      weeks: Array.from({ length: 20 }, (_, w) => ({
        week: w + 1,
        days: [
          { type: "Video", title: `Day 1: Lesson ${w + 1}.1` },
          { type: "Video", title: `Day 2: Lesson ${w + 1}.2` },
          { type: "Document", title: `Day 3: Notes ${w + 1}.3` },
          { type: "Video", title: `Day 4: Lesson ${w + 1}.4` },
          { type: "Document", title: `Day 5: Practice Material ${w + 1}` },
        ],
      })),
    },
    {
      id: 2,
      title: "10 Month Course",
      duration: "40 Weeks",
      weeks: Array.from({ length: 40 }, (_, w) => ({
        week: w + 1,
        days: [
          { type: "Video", title: `Day 1: Lesson ${w + 1}.1` },
          { type: "Document", title: `Day 2: Notes ${w + 1}.2` },
          { type: "Video", title: `Day 3: Lesson ${w + 1}.3` },
          { type: "Video", title: `Day 4: Lesson ${w + 1}.4` },
          { type: "Document", title: `Day 5: Study Material ${w + 1}` },
        ],
      })),
    },
  ]);

  /** ----------------------------------------------------
   * 2. BACKEND FETCH VERSION (commented for now)
   * ---------------------------------------------------- */
  // useEffect(() => {
  //   fetch("http://localhost:5000/api/courses")
  //     .then((res) => res.json())
  //     .then((data) => setCourses(data))
  //     .catch((err) => console.error("Error fetching courses:", err));
  // }, []);
  //
  // const handleAddWeek = (courseId, weekData) => {
  //   fetch(`http://localhost:5000/api/courses/${courseId}/weeks`, {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(weekData),
  //   })
  //     .then(() => fetchCourses())
  //     .catch((err) => console.error("Error adding week:", err));
  // };

  return (
    <AdminLayout>
      <h3 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
        Manage Courses
      </h3>

      <div className="accordion" id="adminCourseAccordion">
        {courses.map((course, idx) => (
          <div className="accordion-item mb-3" key={course.id}>
            <h2 className="accordion-header" id={`courseHeading${idx}`}>
              <button
                className="accordion-button collapsed fw-bold"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#courseCollapse${idx}`}
                aria-expanded="false"
                aria-controls={`courseCollapse${idx}`}
              >
                {course.title} ({course.duration})
              </button>
            </h2>
            <div
              id={`courseCollapse${idx}`}
              className="accordion-collapse collapse"
              aria-labelledby={`courseHeading${idx}`}
              data-bs-parent="#adminCourseAccordion"
            >
              <div className="accordion-body">
                {/* Weeks Accordion */}
                <div className="accordion" id={`weeksAccordion${idx}`}>
                  {course.weeks.map((week, wIdx) => (
                    <div className="accordion-item mb-2" key={wIdx}>
                      <h2 className="accordion-header" id={`weekHeading${idx}-${wIdx}`}>
                        <button
                          className="accordion-button collapsed"
                          type="button"
                          data-bs-toggle="collapse"
                          data-bs-target={`#weekCollapse${idx}-${wIdx}`}
                          aria-expanded="false"
                          aria-controls={`weekCollapse${idx}-${wIdx}`}
                        >
                          Week {week.week}
                        </button>
                      </h2>
                      <div
                        id={`weekCollapse${idx}-${wIdx}`}
                        className="accordion-collapse collapse"
                        aria-labelledby={`weekHeading${idx}-${wIdx}`}
                        data-bs-parent={`#weeksAccordion${idx}`}
                      >
                        <div className="accordion-body">
                          <div className="row g-3">
                            {week.days.map((day, dIdx) => (
                              <div className="col-md-4" key={dIdx}>
                                <div
                                  className="card shadow-sm p-3 text-center"
                                  style={{
                                    borderRadius: "12px",
                                    background:
                                      day.type === "Video"
                                        ? "#8B5E3C"
                                        : "#5A3825",
                                    color: "white",
                                  }}
                                >
                                  <span className="badge bg-light text-dark">
                                    {day.type}
                                  </span>
                                  <h6 className="mt-2">{day.title}</h6>
                                  <button className="btn btn-sm btn-outline-light mt-2">
                                    Upload
                                  </button>
                                  <button className="btn btn-sm btn-danger mt-2 ms-2">
                                    Delete
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default ManageCourses;
