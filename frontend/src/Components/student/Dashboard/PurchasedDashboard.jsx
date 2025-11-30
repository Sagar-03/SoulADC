import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import StudentLayout from "../StudentLayout";
import "./dashboard.css";
import { getPurchasedCourses } from "../../../Api/api"; // Import the new API function


const PurchasedDashboard = () => {
  const navigate = useNavigate();

  const [approvedCourses, setApprovedCourses] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      try {
        const { data } = await getPurchasedCourses();
        setApprovedCourses(data.approvedCourses || []);
        setPendingCourses(data.pendingCourses || []);
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
      <h2 className="mb-4 fw-bold" style={{ color: "#5A3825" }}>
        My Courses
      </h2>

      {loading ? (
        <p className="text-muted">Loading your courses...</p>
      ) : approvedCourses.length === 0 && pendingCourses.length === 0 ? (
        <div>
          <p className="text-muted">You haven't purchased any courses yet.</p>
          <p className="text-muted">
            <a href="/courses" className="text-decoration-none">Browse available courses</a> to get started!
          </p>
        </div>
      ) : (
        <>
          {/* Pending Approvals Section */}
          {pendingCourses.length > 0 && (
            <div className="mb-5">
              <div className="d-flex align-items-center gap-2 mb-3">
                <h4 className="fw-bold text-warning">
                  <i className="bi bi-clock-history me-2"></i>
                  Pending Approval
                </h4>
                <span className="badge bg-warning text-dark">{pendingCourses.length}</span>
              </div>
              <div className="alert alert-warning">
                <i className="bi bi-info-circle me-2"></i>
                These courses are waiting for admin approval. You'll get access within 24 hours.
              </div>
              <div className="row g-4">
                {pendingCourses.map((course) => (
                  <div className="col-md-4" key={course._id || course.id}>
                    <div className="card course-card h-100 border-warning">
                      {/* Pending Badge */}
                      <div className="position-relative">
                        {course.thumbnail && (
                          <img
                            src={course.thumbnail}
                            className="card-img-top"
                            alt={course.title}
                            style={{ height: "180px", objectFit: "cover", opacity: 0.7 }}
                          />
                        )}
                        <div className="position-absolute top-0 end-0 m-2">
                          <span className="badge bg-warning text-dark">
                            <i className="bi bi-clock-history me-1"></i>
                            Pending
                          </span>
                        </div>
                      </div>

                      <div className="card-body d-flex flex-column">
                        <h5 className="card-title">{course.title}</h5>
                        <p className="card-text flex-grow-1 text-muted">
                          {course.description}
                        </p>
                        <p className="text-muted small">
                          <strong>Payment Date:</strong> {new Date(course.paymentDate).toLocaleDateString()}
                        </p>
                        <button className="btn btn-outline-warning mt-auto" disabled>
                          <i className="bi bi-hourglass-split me-2"></i>
                          Awaiting Approval
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Approved Courses Section */}
          {approvedCourses.length > 0 && (
            <div>
              <div className="d-flex align-items-center gap-2 mb-3">
                <h4 className="fw-bold text-success">
                  <i className="bi bi-check-circle me-2"></i>
                  My Active Courses
                </h4>
                <span className="badge bg-success">{approvedCourses.length}</span>
              </div>
              <div className="row g-4">
                {approvedCourses.map((course) => (
                  <div className="col-md-4" key={course._id || course.id}>
                    <div
                      className="card course-card h-100 border-success"
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
                        {course.daysRemaining && (
                          <p className="text-muted small">
                            <i className="bi bi-calendar-check me-1"></i>
                            <strong>{course.daysRemaining} days remaining</strong>
                          </p>
                        )}
                        <button className="btn btn-success mt-auto">
                          <i className="bi bi-play-circle me-2"></i>
                          Go to Course
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </StudentLayout>
  );
};

export default PurchasedDashboard;
