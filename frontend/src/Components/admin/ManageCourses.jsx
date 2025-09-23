import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { Link } from "react-router-dom";

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);

  // ========= BACKEND FETCH (commented) =========
  // useEffect(() => {
  //   fetch("http://localhost:5000/api/admin/courses")
  //     .then((res) => res.json())
  //     .then((data) => setCourses(data))
  //     .catch((err) => console.error("Error fetching courses:", err));
  // }, []);

  // TEMP HARDCODE
  useEffect(() => {
    setCourses([
      {
        id: 1,
        title: "5 Month Course",
        duration: "20 Weeks",
        weeks: Array.from({ length: 3 }, (_, w) => ({
          week: w + 1,
          days: [
            { type: "Video", title: `Lesson ${w + 1}.1` },
            { type: "Document", title: `Notes ${w + 1}.2` },
          ],
        })),
      },
      {
        id: 2,
        title: "10 Month Course",
        duration: "40 Weeks",
        weeks: Array.from({ length: 2 }, (_, w) => ({
          week: w + 1,
          days: [
            { type: "Video", title: `Lesson ${w + 1}.1` },
            { type: "Video", title: `Lesson ${w + 1}.2` },
          ],
        })),
      },
    ]);
  }, []);

  return (
    <AdminLayout>
      <h3 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
        Manage Courses
      </h3>

      <Link to="/admin/courses/add" className="btn btn-success mb-3">+ Add Course</Link>

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
                <Link to={`/admin/courses/${course.id}/manage`} className="btn btn-primary mb-3">
                  Manage {course.title}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
};

export default ManageCourses;
