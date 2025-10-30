import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../StudentaLayout";
import "./dashboard.css";
import { getPurchasedCourses } from "../../../Api/api"; // Import the new API function


const PurchasedDashboard = () => {
  const navigate = useNavigate();

  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      try {
        const { data } = await getPurchasedCourses();
        setPurchasedCourses(data);
      } catch (err) {
        console.error("Error fetching purchased courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedCourses();
  }, []);

  return (
    <StudentLayout>
      <h2 className="mb-4 fw-bold flex-grow-1 p-4" style={{ color: "#5A3825" }}>
        My Purchased Courses
      </h2>

      {loading ? (
        <p className="text-muted">Loading your courses...</p>
      ) : purchasedCourses.length === 0 ? (
        <div>
          <p className="text-muted">You haven't purchased any courses yet.</p>
          <p className="text-muted">
            <a href="/courses" className="text-decoration-none">Browse available courses</a> to get started!
          </p>
        </div>
      ) : (
        <div className="row g-4">
          {purchasedCourses.map((course) => (
            <div className="col-md-4" key={course._id || course.id}>
              <div
                className="card course-card h-100"
                onClick={() => navigate(`/mycourse/${course._id || course.id}`)}
                style={{ cursor: "pointer" }}
              >
                {/* Thumbnail */}
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    className="card-img-top"
                    alt={course.title}
                    style={{ height: "180px", objectFit: "cover" }}
                  />
                )}

                {/* Body */}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">{course.title}</h5>
                  <p className="card-text flex-grow-1">
                    {course.description}
                  </p>
                  {/* <p className="text-muted small">
                    <strong>Mentor:</strong> {course.mentor} <br />
                    <strong>Duration:</strong> {course.duration}
                  </p> */}
                  <button className="btn btn-primary mt-auto">
                    Go to Course
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </StudentLayout>
  );
};

export default PurchasedDashboard;
