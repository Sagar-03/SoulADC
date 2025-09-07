import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "./FeatureSection.css";

const FeaturesSection = () => {
  const features = [
    {
      icon: "fas fa-book-open",
      title: "Daily Live",
      subtitle: "Interactive Classes",
    },
    {
      icon: "fas fa-file-alt",
      title: "10 Million+",
      subtitle: "Test Papers & Notes",
    },
    {
      icon: "fas fa-user-circle",
      title: "24X7",
      subtitle: "Doubt Solving",
    },
    {
      icon: "fas fa-chart-bar",
      title: "Rank Predictor",
      subtitle: "Compare Results",
    },
  ];

  return (
    <section className="features-section">
      <div className="container">
        <div className="row text-center">
          {features.map((feature, index) => (
            <div className="col-md-3 feature-box" key={index}>
              <div className="icon-box mb-3">
                <i className={feature.icon}></i>
              </div>
              <h5 className="feature-title">{feature.title}</h5>
              <p className="feature-subtitle">{feature.subtitle}</p>
              {index !== features.length - 1 && (
                <div className="vertical-divider"></div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
