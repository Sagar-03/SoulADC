import React from "react";
import "./Highlights.css"; // custom styles
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const Highlights = () => {
  const features = [
    {
      icon: "bi-camera-video",
      title: "Interactive Video Lectures",
      description:
        "High-quality recorded sessions with ADC-qualified mentors",
    },
    {
      icon: "bi-file-earmark-text",
      title: "Comprehensive Study Materials",
      description: "Updated curriculum aligned with latest ADC requirements",
    },
    {
      icon: "bi-clipboard2-check",
      title: "Practice Tests",
      description: "Regular assessments to track your progress and readiness",
    },
    {
      icon: "bi-people",
      title: "Mentor Support",
      description:
        "Direct access to ADC-qualified professionals for guidance",
    },
  ];

  const highlights = [
    "Modules live Q&A sessions",
    "Personalized study plans",
    "Progress tracking dashboard",
    "Mobile-friendly platform",
    "Lifetime access to materials",
    "Certificate of completion",
  ];

  const FeatureItem = ({ icon, title, description }) => (
    <div className="d-flex align-items-start mb-4">
      <div className="feature-icon-container me-3">
        <i className={icon}></i>
      </div>
      <div>
        <h5 className="fw-bold mb-1">{title}</h5>
        <p className="text-muted mb-0">{description}</p>
      </div>
    </div>
  );

  return (
    <div className="container py-5">
      {/* Gradient defs for check icons */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A98C6A" stopOpacity="1" />
            <stop offset="100%" stopColor="#7B563D" stopOpacity="1" />
          </linearGradient>
        </defs>
      </svg>

      <div className="row g-5">
        {/* Features Card */}
        <div className="col-lg-6">
          <div className="card card-custom p-4">
            <div className="card-body">
              <h2 className="section-title mb-5 fs-2">What You'll Get</h2>
              {features.map((feature, index) => (
                <FeatureItem key={index} {...feature} />
              ))}
            </div>
          </div>
        </div>

        {/* Highlights & Pricing Card */}
        <div className="col-lg-6">
          <div className="card card-custom p-4">
            <div className="card-body d-flex flex-column">
              <h2 className="section-title mb-5 fs-2">Course Highlights</h2>
              <ul className="list-unstyled flex-grow-1">
                {highlights.map((highlight, index) => (
                  <li
                    key={index}
                    className="d-flex align-items-center mb-3"
                  >
                    <svg
                      viewBox="0 0 512 512"
                      className="me-3"
                      style={{
                        width: "1.75rem",
                        height: "1.75rem",
                        flexShrink: 0,
                      }}
                    >
                      <path
                        d="M448 256c0-106-86-192-192-192S64 150 64 256s86 192 192 192 192-86 192-192z"
                        fill="none"
                        stroke="url(#iconGradient)"
                        strokeMiterlimit="10"
                        strokeWidth="32"
                      />
                      <path
                        fill="none"
                        stroke="url(#iconGradient)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="32"
                        d="M336 192L225.2 302.8 176 254"
                      />
                    </svg>
                    <span>{highlight}</span>
                  </li>
                ))}
              </ul>
              <hr className="my-4" />
              <div className="row g-3">
                <div className="col-6">
                  <div className="price-card text-center d-flex flex-column justify-content-center">
                    {/* <div className="price-value">$</div> */}
                    <div className="price-label">5 Month Course</div>
                  </div>
                </div>
                <div className="col-6">
                  <div className="price-card text-center d-flex flex-column justify-content-center">
                    {/* <div className="price-value">$10</div> */}
                    <div className="price-label">10 month course</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>  
    </div>
  );
};

export default Highlights;
