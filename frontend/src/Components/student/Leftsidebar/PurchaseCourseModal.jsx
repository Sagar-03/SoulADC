import React from "react";
import "./PurchaseCourseModal.css";

const PurchaseCourseModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePurchase = () => {
    window.location.href = "/courses"; // Redirect to courses page
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content-purchase" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header-purchase">
          <h3>🔒 Access Restricted</h3>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        <div className="modal-body-purchase">
          <div className="icon-container">
            <svg
              width="80"
              height="80"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
                fill="#A98C6A"
              />
            </svg>
          </div>
          <p className="modal-message">
            You currently have access to <strong>Mock Exams only</strong>.
          </p>
          <p className="modal-submessage">
            Purchase a course to unlock full access including Dashboard, My Courses, Documents, and more!
          </p>
        </div>
        <div className="modal-footer-purchase">
          <button className="btn-secondary-modal" onClick={onClose}>
            Cancel
          </button>
          <button className="btn-primary-modal" onClick={handlePurchase}>
            Browse Courses
          </button>
        </div>
      </div>
    </div>
  );
};

export default PurchaseCourseModal;
