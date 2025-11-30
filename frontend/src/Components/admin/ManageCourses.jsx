import React, { useState, useEffect } from "react";
import AdminLayout from "./AdminLayout";
import { Link } from "react-router-dom";
import { getCourses, toggleCourseLiveApi, deleteCourse } from "../../Api/api";

const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const { data } = await getCourses(); // Axios handles JSON parsing
        setCourses(data.courses || []);
      } catch (err) {
        console.error("Error fetching courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);


  const toggleCourseLive = async (courseId, currentStatus) => {
  try {
    const { data } = await toggleCourseLiveApi(courseId);

    // Update local state
    setCourses(courses.map(course =>
      course._id === courseId
        ? { ...course, isLive: !currentStatus }
        : course
    ));

    alert(data.message);
  } catch (err) {
    console.error("Error toggling course live status:", err);
    alert("Failed to update course status");
  }
};

  const handleDeleteCourse = async (courseId, courseTitle) => {
    if (!window.confirm(`Are you sure you want to delete "${courseTitle}"?\n\nThis action cannot be undone and will delete all course content including videos, documents, and weeks.`)) {
      return;
    }

    try {
      await deleteCourse(courseId);
      
      // Update local state to remove deleted course
      setCourses(courses.filter(course => course._id !== courseId));
      
      alert(` Course "${courseTitle}" deleted successfully!`);
    } catch (err) {
      console.error("Error deleting course:", err);
      alert("Failed to delete course: " + (err.response?.data?.error || err.message));
    }
  };

  if (loading) return <AdminLayout><p>Loading courses...</p></AdminLayout>;

  return (
    <AdminLayout>
      <h3 className="fw-bold mb-4" style={{ color: "#5A3825" }}>
        Manage Courses
      </h3>

      <Link to="/admin/courses/add" className="btn btn-success mb-3">
        + Add Course
      </Link>

      {courses.length === 0 ? (
        <p>No courses available. Add one!</p>
      ) : (
        <div className="accordion" id="adminCourseAccordion">
          {courses.map((course, idx) => (
            <div className="accordion-item mb-3" key={course._id}>
              <h2 className="accordion-header" id={`courseHeading${idx}`}>
                <button
                  className="accordion-button collapsed fw-bold"
                  type="button"
                  data-bs-toggle="collapse"
                  data-bs-target={`#courseCollapse${idx}`}
                  aria-expanded="false"
                  aria-controls={`courseCollapse${idx}`}
                >
                  {course.title} ({course.weeks?.length || 0} Weeks)
                  <span className={`badge ms-2 ${course.isLive ? 'bg-success' : 'bg-secondary'}`}>
                    {course.isLive ? 'LIVE' : 'DRAFT'}
                  </span>
                </button>
              </h2>
              <div
                id={`courseCollapse${idx}`}
                className="accordion-collapse collapse"
                aria-labelledby={`courseHeading${idx}`}
                data-bs-parent="#adminCourseAccordion"
              >
                <div className="accordion-body">
                  <div className="row">
                    <div className="col-md-8">
                      <p>{course.description}</p>
                      <p><strong>Price:</strong> ${course.price}</p>
                    </div>
                    {course.thumbnail && (
                      <div className="col-md-4">
                        <div className="mb-3">
                          <strong>Thumbnail:</strong>
                          <div className="mt-2">
                            <img
                              src={`${import.meta.env.VITE_API_URL || "http://localhost:7001/api"}/stream/${course.thumbnail}`}
                              alt={`${course.title} thumbnail`}
                              style={{ 
                                maxWidth: "100%", 
                                maxHeight: "120px", 
                                borderRadius: "8px",
                                objectFit: "cover",
                                border: "1px solid #ddd"
                              }}
                              onError={(e) => {
                                e.target.style.display = "none";
                                e.target.parentNode.innerHTML = '<div class="text-muted" style="padding: 20px; border: 1px dashed #ccc; border-radius: 8px; text-align: center;">Thumbnail not available</div>';
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="d-flex gap-2 mb-3 flex-wrap">
                    <Link
                      to={`/admin/courses/${course._id}/manage`}
                      className="btn btn-primary"
                    >
                      Manage Content
                    </Link>

                    <Link
                      to={`/admin/courses/${course._id}/edit`}
                      className="btn btn-warning"
                    >
                      Edit Course
                    </Link>

                    <button
                      className={`btn ${course.isLive ? 'btn-warning' : 'btn-success'}`}
                      onClick={() => toggleCourseLive(course._id, course.isLive)}
                    >
                      {course.isLive ? 'Make Draft' : 'Make Live'}
                    </button>

                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteCourse(course._id, course.title)}
                    >
                      Delete Course
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default ManageCourses;
