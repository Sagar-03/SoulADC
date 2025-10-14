import React from 'react';
import './CourseFeatures.css';

// --- SVG Icons ---
const ClockIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"></circle>
    <polyline points="12 6 12 12 16 14"></polyline>
  </svg>
);

const BookIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20v2H6.5A2.5 2.5 0 0 1 4 19.5z"></path>
    <path d="M4 7h16v10H4z"></path>
    <path d="M20 7H6.5A2.5 2.5 0 0 1 4 4.5v0A2.5 2.5 0 0 1 6.5 2H20v5z"></path>
  </svg>
);

const UsersIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
    <circle cx="8.5" cy="7" r="4"></circle>
    <line x1="18" y1="8" x2="23" y2="13"></line>
    <line x1="23" y1="8" x2="18" y2="13"></line>
  </svg>
);

// --- Main Component ---
const CourseFeatures = () => {
  return (
    <>
      <div className="feature-section text-center">
        <div className="container">
          <div className="program-badge">Our Program</div>
          <h1 className="section-title">
            5-Month <span className="gradient-text">ADC Part 1</span> Preparation Course
          </h1>
          <p className="section-subtitle">
            A meticulously designed program that covers every aspect of the ADC Part 1 examination, ensuring you're fully prepared for success.
          </p>

          <div className="row g-4 justify-content-center">
            {/* Feature 1: Duration */}
            <div className="col-lg-4 col-md-4 col-sm-6">
              <div className="feature-card h-100">
                <div className="icon-wrapper">
                  <ClockIcon />
                </div>
                <h3 className="card-title">5 / 10 Months</h3>
                <p className="card-text">Intensive preparation program</p>
              </div>
            </div>

            {/* Feature 2: Modules */}
            <div className="col-lg-4 col-md-4 col-sm-6">
              <div className="feature-card h-100">
                <div className="icon-wrapper">
                  <BookIcon />
                </div>
                <h3 className="card-title">Structured Modules</h3>
                <p className="card-text">Comprehensive curriculum coverage</p>
              </div>
            </div>

            {/* Feature 3: Mentors */}
            <div className="col-lg-4 col-md-4 col-sm-6">
              <div className="feature-card h-100">
                <div className="icon-wrapper">
                  <UsersIcon />
                </div>
                <h3 className="card-title">Expert Mentor</h3>
                <p className="card-text">Learn with professional Mentor</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CourseFeatures;
