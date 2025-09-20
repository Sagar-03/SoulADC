import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./mycourse.css";
import StudentLayout from "../StudentaLayout";

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

const documents = [
  { title: "ADC Part-1 Mock Paper 01", tag: "PDF" },
  { title: "ADC Part-1 Mock Paper 02", tag: "PDF" },
  { title: "Therapeutics: High-Yield Notes", tag: "DOC" },
  { title: "Clinical Units – Quick Guide", tag: "PDF" },
];

const Mycourse = () => {
  const [tab, setTab] = useState("content"); // "content" | "documents"
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [activeDay, setActiveDay] = useState(0); // 0 = Day 1

  return (
    <StudentLayout>
      <div className="course-page">
        {/* Banner */}
        <div className="container">
          <div className="banner text-white text-center py-5 mb-4">
            <h1 className="fw-bold mb-1">ADC Part 1 Course</h1>
            <p className="mb-0">7-Week comprehensive plan with expert guidance</p>
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
                  {weeks.map((w) => (
                    <button
                      key={w.week}
                      className={`list-group-item list-group-item-action ${selectedWeek === w.week ? "active" : ""
                        }`}
                      onClick={() => {
                        setSelectedWeek(w.week);
                        setActiveDay(0); // reset to Day 1 when switching week
                      }}
                    >
                      ADC PART-1 WEEK {String(w.week).padStart(2, "0")} STUDY PLAN
                    </button>
                  ))}
                </div>
              </aside>

              {/* Center: Days list */}
              <main className="col-lg-9">
                <h5 className="section-heading mb-3">
                  Week {selectedWeek} — Study Plan
                </h5>

                <div className="days-list">
                  {weeks[selectedWeek - 1].days.map((day, idx) => (
                    <div
                      key={idx}
                      className={`content-row ${activeDay === idx ? "active" : ""
                        }`}
                      onClick={() => setActiveDay(idx)}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <span className={`type-chip ${day.type.toLowerCase()}`}>
                          {day.type}
                        </span>
                        <span className="title">{day.title}</span>
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <button className="btn btn-sm btn-outline-dark">
                          Open
                        </button>
                      </div>
                    </div>
                  ))}
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
