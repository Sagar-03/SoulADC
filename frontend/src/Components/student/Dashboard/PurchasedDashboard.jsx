import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../StudentaLayout";
import "./dashboard.css";

const PurchasedDashboard = () => {
  const navigate = useNavigate();

  /** ----------------------------------------------------
   * 1. HARDCODED DATA (for now)
   * ---------------------------------------------------- */
  const purchasedCourses = [
    {
      id: 1,
      title: "ADC Part 1 Course",
      description: "7 Week Comprehensive Study Plan with Expert Guidance",
      mentor: "Dr. Chidambra Marker",
      duration: "7 Weeks",
      thumbnail: "/assets/adc-part1.jpg",
    },
    {
      id: 2,
      title: "Periodontology Special Prep",
      description: "Focused module on advanced Periodontology",
      mentor: "Dr. XYZ",
      duration: "3 Weeks",
      thumbnail: "/assets/periodontology.jpg",
    },
  ];

  /** ----------------------------------------------------
   * 2. API FETCH VERSION (Uncomment later when backend ready)
   * ---------------------------------------------------- */
  // const [purchasedCourses, setPurchasedCourses] = useState([]);
  // useEffect(() => {
  //   fetch("http://localhost:5000/api/student/courses")
  //     .then((res) => res.json())
  //     .then((data) => setPurchasedCourses(data))
  //     .catch((err) => console.error("Error fetching courses:", err));
  // }, []);

  return (
    <StudentLayout>
      <h2 className="mb-4 fw-bold flex-grow-1 p-4" style={{ color: "#5A3825" }}>
        My Purchased Courses
      </h2>

      <div className="row g-4">
        {purchasedCourses.length === 0 ? (
          <p className="text-muted">No courses purchased yet.</p>
        ) : (
          purchasedCourses.map((course) => (
            <div className="col-md-4" key={course.id}>
              <div
                className="card course-card h-100"
                onClick={() => navigate("/mycourse")}
                style={{ cursor: "pointer" }}
              >
                {/* Thumbnail */}
                <img
                  src={course.thumbnail}
                  className="card-img-top"
                  alt={course.title}
                  style={{ height: "180px", objectFit: "cover" }}
                />

                {/* Body */}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{course.title}</h5>
                  <p className="card-text flex-grow-1">
                    {course.description}
                  </p>
                  <p className="text-muted small">
                    <strong>Mentor:</strong> {course.mentor} <br />
                    <strong>Duration:</strong> {course.duration}
                  </p>
                  <button className="btn btn-primary mt-auto">
                    Go to Course
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </StudentLayout>
  );
};

export default PurchasedDashboard;
