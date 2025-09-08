import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "./About.css";
import studentImg from "../../../assets/Student.png"; // replace with your image path

const AboutUs = () => {
  return (
    <section className="about-section container py-5">
      {/* Center Heading */}
      <h2 className="about-title text-center mb-5">About Us</h2>

      <div class="container">
  <div class="row align-items-center justify-content-center">

    <div class="col-md-5">
      <h3 class="about-subtitle fs-2">
        Redefining Dental Education for International Dentists
      </h3>
      <p class="about-text mt-3 fs-5">
        Giving every student the opportunity to access the best education
        and open the door to the world of knowledge.
      </p>
      <p class="about-text fs-5">
        Start your learning journey today with <strong>learnADS</strong> to
        become an outstanding student in our learning community.
      </p>
    </div>

    <div class="col-md-6 text-center position-relative">
      <div class="yellow-bg"></div>
      <img src={studentImg} alt="Student" class="about-img img-fluid" />
    </div>

  </div>
</div>
    </section>
  );
};

export default AboutUs;
