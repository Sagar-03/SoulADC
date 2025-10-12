import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./css.css";
import CourseCard from "./CourseCard";
import { getLiveCourses } from "../../Api/api";
import { getAuthToken } from "../../utils/auth";
import { useNavigate } from "react-router-dom";

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLiveCourses = async () => {
      try {
        const response = await getLiveCourses();
        setCourses(response.data);
      } catch (err) {
        console.error("Error fetching live courses:", err);
        setError("Failed to load courses. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchLiveCourses();
  }, []);

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger text-center">
          {error}
        </div>
      </div>
    );
  }

  

  return (
    <>
      {/* HERO */}
      <header className="hero-wrap py-5 py-md-6">
        <div className="container">
          <div className="row align-items-center g-4">
            <div className="col-12 col-lg-7">
                {/* <span className="hero-kicker mb-3">
                  <span>✅</span> ADC Part 1 Specialists
                </span> */}
              <h1
                className="display-5 fw-bold mb-3"
                style={{ color: "var(--ink)" }}
              >
                Master the <span style={{ color: "var(--brand)" }}>ADC Part 1</span>{" "}
                with Expert-Led Programs
              </h1>
              <p className="lead text-muted mb-4">
                Choose from our carefully designed courses with expert mentors. 
                All programs include comprehensive coverage, practice tests, and personalized guidance.
              </p>
              {courses.length > 0 && (
                <div className="d-flex gap-2">
                  <a href="#courses" className="btn btn-dark">
                    View Courses
                  </a>
                  <a href="https://wa.me/0000000000" className="btn btn-outline-dark">
                    Talk to a Mentor
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* COURSE CARDS */}
      <main className="py-5" id="courses">
        <div className="container">
          {courses.length === 0 ? (
            <div className="text-center">
              <h3 className="text-muted">No courses available at the moment</h3>
              <p className="text-muted">Please check back later for new course offerings.</p>
            </div>
          ) : (
            <div className="row">
              {courses.map((course) => (
                <CourseCard course={course} key={course._id} />
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}
