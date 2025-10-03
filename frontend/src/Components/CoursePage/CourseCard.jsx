import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./css.css";
import { isAuthenticated, setRedirectAfterLogin } from "../../utils/auth";

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const formatPrice = (price) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(price);

  const getAccentColor = (index = 0) => {
    const colors = ["#a1754f", "#7a5b3e", "#8B4513", "#A0522D", "#CD853F"];
    return colors[index % colors.length];
  };

  const courseData = {
    title: course.title || "Course Title",
    description: course.description || "Course description not available.",
    price: course.price || 0,
    thumbnail: course.thumbnail || "",
    duration: `${course.weeks?.length || 0} weeks`,
    weeks: course.weeks || [],
    _id: course._id || course.id,
    accent: getAccentColor(),
    ribbon:
      course.weeks?.length > 10
        ? "Comprehensive"
        : course.weeks?.length > 5
        ? "Popular"
        : null,
  };

  const handleEnroll = () => {
    const paymentUrl = `/payment?courseId=${courseData._id}&title=${courseData.title}&price=${courseData.price}`;

    if (!isAuthenticated()) {
      setRedirectAfterLogin(paymentUrl); // ✅ save in cookie
      navigate("/login");
    } else {
      navigate(paymentUrl);
    }
  };

  return (
    <section id={courseData._id} className="col-12 col-lg-6 mb-4">
      <div className="card h-100 border-0 shadow-lg position-relative course-card">
        {courseData.ribbon && (
          <div className="ribbon bg-dark text-white small fw-semibold">
            {courseData.ribbon}
          </div>
        )}

        {courseData.thumbnail && (
          <div className="course-thumbnail-container">
            <img
              src={courseData.thumbnail}
              alt={courseData.title}
              className="card-img-top course-thumbnail"
              style={{ height: "200px", objectFit: "cover" }}
              onError={(e) => (e.target.style.display = "none")}
            />
          </div>
        )}

        <div className="card-body p-4 p-md-5">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h3 className="h2 mb-0 fw-bold">{courseData.title}</h3>
            <span
              className="badge rounded-pill"
              style={{ backgroundColor: courseData.accent, color: "white" }}
            >
              {courseData.duration}
            </span>
          </div>

          <p className="text-muted mb-3">{courseData.description}</p>

          <div className="mb-3">
            <span className="h4 fw-bold text-success">
              {formatPrice(courseData.price)}
            </span>
          </div>

          {courseData.weeks.length > 0 && (
            <>
              <button
                className="btn btn-sm btn-outline-dark mt-3"
                onClick={() => setOpen(!open)}
              >
                {open ? "Hide Curriculum" : "Show Curriculum"}
              </button>

              {open && (
                <div className="mt-3">
                  <h6 className="fw-bold">Course Curriculum:</h6>
                  <ul className="ps-3 small">
                    {courseData.weeks.map((week, i) => (
                      <li key={week._id || i} className="mb-2">
                        <strong>Week {week.weekNumber || i + 1}:</strong>{" "}
                        {week.title || `Week ${i + 1} Content`}
                        {week.days && week.days.length > 0 && (
                          <ul className="ps-3 mt-1">
                            {week.days.map((day, dayIndex) => (
                              <li
                                key={day._id || dayIndex}
                                className="text-muted"
                              >
                                Day {day.dayNumber}: {day.title}
                                {day.contents?.length > 0 && (
                                  <span className="badge bg-light text-dark ms-2">
                                    {day.contents.length} items
                                  </span>
                                )}
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}

          <div className="mt-3">
            <h6 className="fw-bold">What you'll get:</h6>
            <ul className="ps-3 small">
              <li>Expert mentor guidance</li>
              <li>Comprehensive study materials</li>
              <li>Practice tests & assessments</li>
              <li>Doubt clearing sessions</li>
              <li>Progress tracking</li>
            </ul>
          </div>

          <div className="mt-4 d-flex gap-2">
            <button onClick={handleEnroll} className="btn btn-dark">
              Enroll Now
            </button>
            <a
              href="https://wa.me/0000000000"
              className="btn btn-outline-dark"
              target="_blank"
              rel="noopener noreferrer"
            >
              Talk to Mentor
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
