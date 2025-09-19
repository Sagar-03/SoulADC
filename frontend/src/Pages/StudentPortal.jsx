import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js"; // ✅ important for dropdown toggle
import "./studentPortal.css";

const weeks = Array.from({ length: 7 }, (_, w) => ({
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

const StudentCoursePage = () => {
  return (
    <div className="course-page">
      {/* ===== Top Banner ===== */}
      <div className="banner text-center text-white py-5">
        <h1 className="fw-bold">ADC Part 1 Course</h1>
        <p>7 Week Comprehensive Study Plan with Expert Guidance</p>
      </div>

      {/* ===== Course Content ===== */}
      <div className="container py-5">
        <h2 className="mb-4 text-center">Course Content</h2>
        <div className="accordion" id="courseAccordion">
          {weeks.map((week, index) => (
            <div className="accordion-item mb-2" key={index}>
              <h2 className="accordion-header" id={`heading${index}`}>
                <button
                  className="accordion-button collapsed"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#collapse${index}`}
                  aria-expanded="false"
                  aria-controls={`collapse${index}`}
                >
                  Week {week.week} Study Plan
                </button>
              </h2>
              <div
                id={`collapse${index}`}
                className="accordion-collapse collapse"
                aria-labelledby={`heading${index}`}
                data-bs-parent="#courseAccordion"
              >
                <div className="accordion-body">
                  <div className="row g-3">
                    {week.days.map((day, idx) => (
                      <div className="col-md-4" key={idx}>
                        <div className={`content-box ${day.type.toLowerCase()}`}>
                          <span className="badge-type">{day.type}</span>
                          <h6 className="mt-2">{day.title}</h6>
                          <button className="btn btn-sm btn-outline-light mt-2">
                            Open
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
  );
};

export default StudentCoursePage;
