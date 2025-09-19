import React, { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

/**
 * SOUL ADC — Courses Page
 * - Two premium cards (5-Month Sprint, 10-Month Mastery)
 * - Bold hero headline w/ brand colors
 * - Comparison strip
 * - Collapsible curriculum per course (handled in React state)
 * - Accessible & responsive
 */

const COURSES = [
    {
        id: "five",
        title: "5-Month Sprint",
        subtitle: "Intensive Mentor-Led Prep",
        ribbon: "Most Popular",
        duration: "5 months",
        pace: "Accelerated",
        schedule: "3–4 live sessions / week",
        start: "New cohort every month",
        priceNote: "Flexible installments",
        highlights: [
            "Personal mentor guidance",
            "Comprehensive Part 1 coverage",
            "Weekly practice tests & analytics",
            "Doubt-clearing huddles (24–48h)",
            "Final full-length mock exam",
        ],
        modules: [
            "Orientation & Study System",
            "Anatomy, Physiology, Pathology",
            "Microbiology & Pharmacology",
            "Dental Materials & Radiology",
            "Occlusion & Operative Dentistry",
            "Ethics, Law & Evidence-based Dentistry",
            "Full Revision + Mocks",
        ],
        ctaPrimary: { label: "Enroll Now", href: "/enroll?plan=5m" },
        ctaSecondary: { label: "Talk to a Mentor", href: "https://wa.me/0000000000" },
        accent: "#a1754f",
    },
    {
        id: "ten",
        title: "10-Month Mastery",
        subtitle: "Steady, Deep-Dive Track",
        ribbon: "Best for Beginners",
        duration: "10 months",
        pace: "Measured",
        schedule: "2–3 live sessions / week",
        start: "Next cohort this term",
        priceNote: "Early-bird discounts",
        highlights: [
            "Foundations + advanced depth",
            "More time for spaced revision",
            "Extra formative quizzes",
            "Peer study circles + mentor check-ins",
            "Full mock + viva-style review",
        ],
        modules: [
            "Roadmap & Baseline Assessment",
            "Basic Medical Sciences — fundamentals first",
            "Clinical Sciences — systems approach",
            "Dental Public Health & Ethics",
            "High-yield topics & pitfalls",
            "Revision cycles + question banks",
            "Grand Mock + Exam Strategy",
        ],
        ctaPrimary: { label: "Enroll Now", href: "/enroll?plan=10m" },
        ctaSecondary: { label: "Book a Call", href: "mailto:hello@souladc.example" },
        accent: "#7a5b3e",
    },
];

function CourseCard({ course, index }) {
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

                    {/* …rest of your JSX stays the same … */}
                </div>
            </div>
        </section>
    );
}


export default function CoursesPage() {
    return (
        <>
            {/* Brand styles (kept here for easy drop-in;
          move to your CSS bundle if you prefer) */}
            <style>{`
        :root{
          --brand: #8f6a49;          /* warm gold-brown */
          --brand-deep: #5b3f2a;     /* darker accent */
          --ink: #2b2b2b;
        }

        .hero-wrap{
          background: radial-gradient(1200px 600px at 20% -10%, rgba(161,117,79,.18), transparent),
                      radial-gradient(800px 400px at 95% 10%, rgba(123,91,62,.12), transparent);
        }

        .hero-kicker{
          background: #f4ede6;
          color: #6a513d;
          border: 1px solid #e6d7c9;
          padding:.35rem .75rem;
          border-radius: 999px;
          font-weight: 600;
          display:inline-flex;
          align-items:center;
          gap:.5rem;
        }

        .course-card{
          border-radius: 1rem;
          overflow: hidden;
        }

        .ribbon{
          position:absolute;
          top:14px; left:-8px;
          padding:.25rem .75rem;
          border-top-right-radius:.5rem;
          border-bottom-right-radius:.5rem;
          box-shadow: 0 6px 18px rgba(0,0,0,.08);
          background: var(--brand);
        }

        .check-dot{
          display:inline-block;
          width: .85rem; height:.85rem;
          border-radius:50%;
          margin-top:.375rem;
          box-shadow: 0 0 0 3px rgba(161,117,79,.12);
        }

        .compare-cell{
          background:#fff;
          border:1px solid #eee;
          border-radius:.75rem;
          padding:1rem;
          height:100%;
        }
      `}</style>

            {/* HERO */}
            <header className="hero-wrap py-5 py-md-6">
                <div className="container">
                    <div className="row align-items-center g-4">
                        <div className="col-12 col-lg-7">
                            <span className="hero-kicker mb-3">
                                <span>✅</span> ADC Part 1 Specialists
                            </span>
                            <h1 className="display-5 fw-bold mb-3" style={{ color: "var(--ink)" }}>
                                Master the <span style={{ color: "var(--brand)" }}>ADC Part 1</span>{" "}
                                with the Program that Fits <em>You</em>
                            </h1>
                            <p className="lead text-muted mb-4">
                                Two clear paths. Same expert mentors. Choose the{" "}
                                <strong>5-Month Sprint</strong> for momentum, or the{" "}
                                <strong>10-Month Mastery</strong> for depth and calmer pacing.
                            </p>
                            <div className="d-flex gap-2">
                                <a href="#five" className="btn btn-dark">See 5-Month</a>
                                <a href="#ten" className="btn btn-outline-dark">See 10-Month</a>
                            </div>
                        </div>

                        <div className="col-12 col-lg-5">
                            <div className="p-4 p-md-5 bg-white rounded-4 shadow-sm">
                                <div className="d-flex align-items-center gap-3 mb-3">
                                    <div
                                        className="rounded-circle d-inline-flex align-items-center justify-content-center"
                                        style={{
                                            width: 56,
                                            height: 56,
                                            background:
                                                "linear-gradient(145deg, var(--brand), var(--brand-deep))",
                                            color: "white",
                                            fontSize: 28,
                                        }}
                                        aria-hidden="true"
                                    >
                                        🎓
                                    </div>
                                    <div>
                                        <h3 className="h5 mb-0">What you’ll get</h3>
                                        <small className="text-muted">Mentor-guided, exam-ready prep</small>
                                    </div>
                                </div>
                                <ul className="mb-0">
                                    <li className="mb-2">Live classes + recordings</li>
                                    <li className="mb-2">Structured curriculum & weekly plans</li>
                                    <li className="mb-2">Practice tests with analytics</li>
                                    <li className="mb-2">Full-length mock & review</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* COURSE CARDS */}
            <main className="py-5">
                <div className="container">
                    <div className="row">
                        {COURSES.map((c, i) => (
                            <CourseCard course={c} index={i} key={c.id} />
                        ))}
                    </div>

                    {/* COMPARISON STRIP */}
                    <section className="mt-4">
                        <div className="row g-3">
                            <div className="col-12">
                                <h2 className="h4 fw-bold mb-2">Which track should I choose?</h2>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="compare-cell">
                                    <div className="small text-muted">Pick</div>
                                    <div className="fw-semibold mb-1">5-Month Sprint</div>
                                    <p className="mb-0 small">
                                        You’re comfortable with faster pace, want quick momentum, and can commit
                                        to more weekly hours.
                                    </p>
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="compare-cell">
                                    <div className="small text-muted">Pick</div>
                                    <div className="fw-semibold mb-1">10-Month Mastery</div>
                                    <p className="mb-0 small">
                                        You prefer steadier depth, more spaced repetition, and lighter weekly load.
                                    </p>
                                </div>
                            </div>

                            <div className="col-12 col-md-4">
                                <div className="compare-cell">
                                    <div className="small text-muted">Both include</div>
                                    <ul className="mb-0 small ps-3">
                                        <li>ADC-aligned curriculum</li>
                                        <li>Mentor access & doubt support</li>
                                        <li>Practice tests + full mock</li>
                                        <li>Recordings & study plans</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* FAQ */}
                    <section className="mt-5">
                        <h2 className="h4 fw-bold mb-3">FAQs</h2>
                        <div className="accordion" id="faq">
                            {[
                                {
                                    q: "Are sessions recorded?",
                                    a: "Yes. All live sessions are recorded and available for catch-up.",
                                },
                                {
                                    q: "Do I need prior clinical experience?",
                                    a: "No—both tracks cover fundamentals. The 10-Month is ideal if you’re starting fresh.",
                                },
                                {
                                    q: "Is there a mock exam?",
                                    a: "Yes—both tracks include a full-length mock with review and personalised feedback.",
                                },
                            ].map((item, i) => (
                                <div className="accordion-item" key={i}>
                                    <h2 className="accordion-header" id={`h-${i}`}>
                                        <button
                                            className={`accordion-button ${i !== 0 ? "collapsed" : ""}`}
                                            type="button"
                                            data-bs-toggle="collapse"
                                            data-bs-target={`#c-${i}`}
                                            aria-expanded={i === 0}
                                            aria-controls={`c-${i}`}
                                        >
                                            {item.q}
                                        </button>
                                    </h2>
                                    <div
                                        id={`c-${i}`}
                                        className={`accordion-collapse collapse ${i === 0 ? "show" : ""}`}
                                        aria-labelledby={`h-${i}`}
                                        data-bs-parent="#faq"
                                    >
                                        <div className="accordion-body">{item.a}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </main>
        </>
    );
}
