import React, { useState } from "react";
import "./css.css";

export default function CourseCard({ course }) {
    const [open, setOpen] = useState(false);

    return (
        <section id={course.id} className="col-12 col-lg-6 mb-4">
            <div className="card h-100 border-0 shadow-lg position-relative course-card">
                {/* Ribbon */}
                {course.ribbon && (
                    <div className="ribbon bg-dark text-white small fw-semibold">
                        {course.ribbon}
                    </div>
                )}

                <div className="card-body p-4 p-md-5">
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <h3 className="h2 mb-0 fw-bold">{course.title}</h3>
                        <span
                            className="badge rounded-pill"
                            style={{
                                backgroundColor: course.accent,
                                color: "white",
                            }}
                        >
                            {course.duration}
                        </span>
                    </div>

                    <p className="text-muted">{course.subtitle}</p>

                    {/* Highlights */}
                    <ul className="mt-3 ps-3 small">
                        {course.highlights.map((h, i) => (
                            <li key={i}>{h}</li>
                        ))}
                    </ul>

                    {/* Toggleable Curriculum */}
                    <button
                        className="btn btn-sm btn-outline-dark mt-3"
                        onClick={() => setOpen(!open)}
                    >
                        {open ? "Hide Curriculum" : "Show Curriculum"}
                    </button>

                    {open && (
                        <ul className="mt-3 ps-3 small">
                            {course.modules.map((m, i) => (
                                <li key={i}>{m}</li>
                            ))}
                        </ul>
                    )}

                    {/* CTA buttons */}
                    <div className="mt-4 d-flex gap-2">
                        <a href={course.ctaPrimary.href} className="btn btn-dark">
                            {course.ctaPrimary.label}
                        </a>
                        <a
                            href={course.ctaSecondary.href}
                            className="btn btn-outline-dark"
                        >
                            {course.ctaSecondary.label}
                        </a>
                    </div>
                </div>
            </div>
        </section>
    );
}
