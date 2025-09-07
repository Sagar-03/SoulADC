import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./About.css";
import studentImg from "../../../assets/Student.png"; // replace with your image path

const AboutUs = () => {
  return (
    <section className="about-section container py-5">
      {/* Center Heading */}
      <h2 className="about-title text-center mb-5">About Us</h2>

      <div className="row align-items-center">
        {/* Left Content */}
        <div className="col-md-6">
          <h3 className="about-subtitle">
            Redefining Dental Education for International Dentists
          </h3>
          <p className="about-text mt-3">
            Giving every student the opportunity to access the best education
            and open the door to the world of knowledge.
          </p>
          <p className="about-text">
            Start your learning journey today with <strong>learnADS</strong> to
            become an outstanding student in our learning community.
          </p>
        </div>

        {/* Right Image */}
        <div className="col-md-6 text-center position-relative">
          <div className="yellow-bg"></div>
          <img src={studentImg} alt="Student" className="about-img img-fluid" />
        </div>
      </div>
    </section>
  );
};

export default AboutUs;
