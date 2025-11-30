import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../Api/api";
import "./CourseApprovalNotification.css";
import { FaCheckCircle, FaTimes } from "react-icons/fa";

const CourseApprovalNotification = ({ notifications, onClose }) => {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isClosing, setIsClosing] = useState(false);

  // Filter only course approval notifications
  const approvalNotifications = notifications.filter(
    (n) => n.type === "course_approved"
  );

  useEffect(() => {
    // Auto-close after 10 seconds if user doesn't interact
    const timer = setTimeout(() => {
      handleClose();
    }, 10000);

    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleClose = async () => {
    setIsClosing(true);
    
    // Mark notifications as read
    try {
      await api.post("/user/notifications/mark-read", {
        notificationIds: approvalNotifications.map((n) => n._id),
      });
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }

    setTimeout(() => {
      onClose();
    }, 300);
  };

  const handleAccessCourse = async (courseId) => {
    // Mark as read
    try {
      await api.post("/user/notifications/mark-read", {
        notificationIds: approvalNotifications.map((n) => n._id),
      });
    } catch (err) {
      console.error("Error marking notifications as read:", err);
    }

    navigate(`/mycourse/${courseId}`);
    onClose();
  };

  const handleNext = () => {
    if (currentIndex < approvalNotifications.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleClose();
    }
  };

  if (approvalNotifications.length === 0) {
    return null;
  }

  const currentNotification = approvalNotifications[currentIndex];

  return (
    <>
      {/* Backdrop */}
      <div className="notification-backdrop" onClick={handleClose}></div>

      {/* Notification Modal */}
      <div className={`notification-modal ${isClosing ? "closing" : ""}`}>
        {/* Close Button */}
        <button className="notification-close-btn" onClick={handleClose}>
          <FaTimes />
        </button>

        {/* Success Icon */}
        <div className="notification-icon">
          <FaCheckCircle />
        </div>

        {/* Content */}
        <div className="notification-content">
          <h2 className="notification-title">Course Approved! 🎉</h2>
          <p className="notification-message">{currentNotification.message}</p>

          {currentNotification.courseId && (
            <div className="notification-course-info">
              <strong>Course:</strong> {currentNotification.courseId.title}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="notification-actions">
          <button
            className="btn-access-course"
            onClick={() =>
              handleAccessCourse(currentNotification.courseId._id)
            }
          >
            Access Your Course
          </button>
          {approvalNotifications.length > 1 && (
            <button className="btn-secondary-action" onClick={handleNext}>
              {currentIndex < approvalNotifications.length - 1
                ? `Next (${currentIndex + 1}/${approvalNotifications.length})`
                : "Done"}
            </button>
          )}
        </div>

        {/* Progress Indicator */}
        {approvalNotifications.length > 1 && (
          <div className="notification-progress">
            {approvalNotifications.map((_, index) => (
              <span
                key={index}
                className={`progress-dot ${
                  index === currentIndex ? "active" : ""
                } ${index < currentIndex ? "completed" : ""}`}
              ></span>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default CourseApprovalNotification;
