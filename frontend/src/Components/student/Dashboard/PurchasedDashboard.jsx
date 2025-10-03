import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../StudentaLayout";
import "./dashboard.css";
import { getLiveCourses } from "../../../Api/api"; // adjust path


const PurchasedDashboard = () => {
  const navigate = useNavigate();

  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      try {
        const { data } = await getLiveCourses();
        setPurchasedCourses(data);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedCourses();
  }, []);

  return (
    <StudentLayout>
      <h2 className="mb-4 fw-bold flex-grow-1 p-4" style={{ color: "#5A3825" }}>
        Available Live Courses
        {/* TODO: Change to "My Purchased Courses" when payment integration is complete */}
      </h2>

      {/* 
      COMMENTED CODE FOR FUTURE IMPLEMENTATION:
      When payment is integrated, this component should:
      1. Fetch user's purchased courses from backend
      2. Filter courses based on user's purchases
      3. Show only courses the user has paid for
      
      Example API call:
      fetch(`http://localhost:7001/api/user/purchased-courses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      */}

      {loading ? (
        <p className="text-muted">Loading courses...</p>
      ) : purchasedCourses.length === 0 ? (
        <div>
          <p className="text-muted">No live courses available at the moment.</p>
          {/* TODO: Change to "No courses purchased yet." when payment integration is complete */}
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
