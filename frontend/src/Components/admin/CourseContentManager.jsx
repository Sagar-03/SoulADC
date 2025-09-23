import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { useParams } from "react-router-dom";

const CourseContentManager = () => {
  const { id } = useParams();
  const [course, setCourse] = useState(null);

  // ========= BACKEND FETCH (commented) =========
  // useEffect(() => {
  //   fetch(`http://localhost:5000/api/admin/courses/${id}`)
  //     .then((res) => res.json())
  //     .then((data) => setCourse(data));
  // }, [id]);

  // TEMP HARDCODE
  useEffect(() => {
    setCourse({
      id,
      title: "5 Month Course",
      weeks: Array.from({ length: 3 }, (_, i) => ({
        week: i + 1,
        days: [
          { type: "Video", title: `Lesson ${i + 1}.1` },
          { type: "Document", title: `Notes ${i + 1}.2` },
        ],
      })),
    });
  }, [id]);

  const handleDelete = (weekIdx, dayIdx) => {
    alert(`Delete Week ${weekIdx + 1}, Day ${dayIdx + 1} (TODO backend call)`);
  };

  const handleEdit = (weekIdx, dayIdx) => {
    alert(`Edit Week ${weekIdx + 1}, Day ${dayIdx + 1} (TODO backend call)`);
  };

  if (!course) return <p>Loading...</p>;

  return (
    <AdminLayout>
      <h3 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
        Manage Content for {course.title}
      </h3>

      <div className="accordion" id="weeksAccordion">
        {course.weeks.map((week, wIdx) => (
          <div className="accordion-item mb-3" key={wIdx}>
            <h2 className="accordion-header" id={`weekHeading${wIdx}`}>
              <button
                className="accordion-button collapsed"
                type="button"
                data-bs-toggle="collapse"
                data-bs-target={`#weekCollapse${wIdx}`}
                aria-expanded="false"
                aria-controls={`weekCollapse${wIdx}`}
              >
                Week {week.week}
              </button>
            </h2>
            <div
              id={`weekCollapse${wIdx}`}
              className="accordion-collapse collapse"
              aria-labelledby={`weekHeading${wIdx}`}
              data-bs-parent="#weeksAccordion"
            >
              <div className="accordion-body">
                <div className="row g-3">
                  {week.days.map((day, dIdx) => (
                    <div className="col-md-4" key={dIdx}>
                      <div
                        className="card shadow-sm p-3 text-center"
                        style={{
                          borderRadius: "12px",
                          background: day.type === "Video" ? "#8B5E3C" : "#5A3825",
                          color: "white",
                        }}
                      >
                        <span className="badge bg-light text-dark">{day.type}</span>
                        <h6 className="mt-2">{day.title}</h6>
                        <button className="btn btn-sm btn-warning mt-2 me-2" onClick={() => handleEdit(wIdx, dIdx)}>
                          Edit
                        </button>
                        <button className="btn btn-sm btn-danger mt-2" onClick={() => handleDelete(wIdx, dIdx)}>
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
    </AdminLayout>
  );
};

export default CourseContentManager;
