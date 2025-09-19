import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css.css";
import CourseCard from "./CourseCard";

// Define COURSES here 👇
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

export default function CoursesPage() {
  return (
    <>
      {/* HERO */}
      <header className="hero-wrap py-5 py-md-6">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg-7">
              <span className="hero-kicker mb-3">
                <span>✅</span> ADC Part 1 Specialists
              </span>
              <h1
                className="display-5 fw-bold mb-3"
                style={{ color: "var(--ink)" }}
              >
                Master the <span style={{ color: "var(--brand)" }}>ADC Part 1</span>{" "}
                with the Program that Fits <em>You</em>
              </h1>
              <p className="lead text-muted mb-4">
                Two clear paths. Same expert mentors. Choose the{" "}
                <strong>5-Month Sprint</strong> for momentum, or the{" "}
                <strong>10-Month Mastery</strong> for depth and calmer pacing.
              </p>
              <div className="d-flex gap-2">
                <a href="#five" className="btn btn-dark">
                  See 5-Month
                </a>
                <a href="#ten" className="btn btn-outline-dark">
                  See 10-Month
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* COURSE CARDS */}
      <main className="py-5">
        <div className="container">
          <div className="row">
            {COURSES.map((c) => (
              <CourseCard course={c} key={c.id} />
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
