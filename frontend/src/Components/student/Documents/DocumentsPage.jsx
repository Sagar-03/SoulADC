import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaFileAlt, FaBook } from "react-icons/fa";
import StudentLayout from "../StudentLayout";
import { getPurchasedCourses } from "../../../Api/api";
import "./DocumentsPage.css";

const DocumentsPage = () => {
  const navigate = useNavigate();
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPurchasedCourses = async () => {
      try {
        const { data } = await getPurchasedCourses();
        
        // Handle new API response format with approvedCourses/allCourses
        const coursesArray = data?.approvedCourses || 
                            data?.allCourses || 
                            (Array.isArray(data) ? data : []);
        
        setPurchasedCourses(coursesArray);
      } catch (err) {
        console.error("Error fetching purchased courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPurchasedCourses();
  }, []);

  const handleCourseSelect = (courseId) => {
    navigate(`/documents/${courseId}`);
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="documents-page-container">
          <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout>
      <div className="documents-page-container">
        {/* Header */}
        <div className="documents-page-header mb-4">
          <h2 className="fw-bold" style={{ color: "#5A3825" }}>
            Notes & Mock Papers
          </h2>
          <p className="text-muted">Select a course to view its Notes and study materials</p>
        </div>

        {purchasedCourses.length === 0 ? (
          <div className="no-courses">
            <div className="text-center py-5">
              <FaBook className="no-courses-icon mb-3" />
              <h5 className="text-muted">No Courses Found</h5>
              <p className="text-muted mb-4">
                You haven't purchased any courses yet.
              </p>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/courses")}
              >
                Browse Courses
              </button>
            </div>
          </div>
        ) : (
          <div className="row g-4">
            {purchasedCourses.map((course) => (
              <div className="col-md-6 col-lg-4" key={course._id || course.id}>
                <div
                  className="course-document-card"
                  onClick={() => handleCourseSelect(course._id || course.id)}
                >
                  <div className="course-card-header">
                    {course.thumbnail && (
                      <img
                        src={course.thumbnail}
                        className="course-thumbnail"
                        alt={course.title}
                      />
                    )}
                    <div className="course-overlay">
                      <FaFileAlt className="documents-icon" />
                    </div>
                  </div>

                  <div className="course-card-body">
                    <h5 className="course-title">{course.title}</h5>
                    <p className="course-description">
                      {course.description}
                    </p>
                    
                    <div className="course-stats">
                      <span className="modules-count">
                        {course.weeks?.length || 0} Modules
                      </span>
                      <span className="documents-count">
                        {course.weeks?.reduce((total, week) => total + (week.documents?.length || 0), 0) || 0} Documents
                      </span>
                    </div>

                    <button className="btn btn-primary course-button">
                      View Notes
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </StudentLayout>
  );
};

export default DocumentsPage;