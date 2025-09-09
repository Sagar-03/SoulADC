import React, { useRef } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Registersection.css';
import adcProgramVideo from '../../../../public/video.mp4';
import ReactPlayer from 'react-player';



const CheckIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg"
    width="20" height="20"
    viewBox="0 0 24 24"
    fill="none" stroke="#6B4226" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round"
    className="me-2">
    <path d="M9 12l2 2 4-4" />  {/* checkmark */}
    <path d="M21 12a9 9 0 1 1-3-6.7" /> {/* incomplete circle */}
  </svg>
);


const Register = () => {
  const videoRef = useRef(null);
  const videoSrc = adcProgramVideo;

  return (
    <Container fluid className="register-section-container p-5">
      <Row className="g-5 align-items-center">
        {/* Left Column for Text and Buttons */}
        <Col md={6}>
          <div className="mb-4">
            {/* Updated ADC Part 1 Specialists Badge */}
            <span className="adc-badge-new mb-3">
              <i className="bi bi-bullseye me-2"></i> ADC Part 1 Specialists
            </span>
            {/* Title with Gradient Text - Font size will be controlled by CSS */}
            <h1 className="register-title">
              Master the <span className="gradient-text-adc">ADC Part 1</span> with Expert Guidance
            </h1>
            <p className="lead register-text fw-4">
              Join our comprehensive 5/10 month program designed by ADC-qualified mentors. Build the foundation for your successful career as an Australian dentist.
            </p>
          </div>

          {/* Feature List */}
          <ul className="list-unstyled mb-4 register-text">
            <li className="mb-2"><CheckIcon /> One on One mentor guidance</li>
            <li className="mb-2"><CheckIcon /> Comprehensive Part 1 curriculum</li>
            <li><CheckIcon /> Practice tests & assessments</li>
          </ul>

          <div className="d-flex">
            <Button variant="dark" className="me-3 px-4 py-2 register-button-dark">Start Your Journey</Button>
            {/* <Button variant="outline-dark" className="px-4 py-2 register-button-outline">Learn More</Button> */}
          </div>

        </Col>

        {/* Right Column for the Badge and Video */}
        <Col md={6} className="d-flex flex-column justify-content-center align-items-center position-relative">
          {/* ADC Qualified badge over the video */}
          <span className="custom-badge custom-badge-left badge-over-video-top-left">
            <div className="badge-icon">
              <i className="bi bi-check-circle-fill"></i>
            </div>
            <span className="badge-text">ADC Qualified <br /> Expert Mentor</span>
          </span>

          <div className="video-player-container">
  <video
    src="/video.mp4"
    autoPlay
    loop
    muted
    playsInline
    className="video-main"
  />
</div>

        </Col>
      </Row>
    </Container>
  );
};

export default Register;