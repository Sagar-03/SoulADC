import React, { useRef } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Registersection.css';
import adcProgramVideo from '../../../../public/video.mp4';

const Register = () => {
  const videoRef = useRef(null);
  const videoSrc = adcProgramVideo;

  return (
    <Container fluid className="register-section-container p-5">
      <Row className="g-5 align-items-center">
        {/* Left Column for Text */}
        <Col md={6}>
          <div className="mb-4">
            <span className="adc-badge mb-2 text-uppercase fw-bold">ADC Part 1 Specialist</span>
            <h1 className="display-4 fw-bold register-title">Master the ADC Part 1 with Expert Guidance</h1>
            <p className="lead register-text">
              Join our comprehensive 5-month program designed by ADC-qualified mentors. Build the foundation for your successful career as an Australian dentist.
            </p>
          </div>
          {/* Feature List */}
          <ul className="list-unstyled mb-4 register-text">
            <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i> ADC-qualified mentor guidance</li>
            <li className="mb-2"><i className="bi bi-check-circle-fill text-success me-2"></i> Comprehensive Part 1 curriculum</li>
            <li><i className="bi bi-check-circle-fill text-success me-2"></i> Practice tests & assessments</li>
          </ul>

          {/* Call-to-Action Buttons */}
          <div className="d-flex">
            <Button variant="dark" className="me-3 px-4 py-2 register-button-dark">Start Your Journey</Button>
            <Button variant="outline-dark" className="px-4 py-2 register-button-outline">Learn More</Button>
          </div>
        </Col>

        {/* Right Column for Video */}
        <Col md={6} className="d-flex justify-content-center align-items-center">
          {/* Main container for the video and badges */}
          <div className="video-player-container">
            {/* Top-left badge */}
            <span className="video-overlay-badge">ADC Qualified <br /> Expert Mentors</span>
            <video
              ref={videoRef}
              src={videoSrc}
              autoPlay
              loop
              muted
              playsInline
              className="video-main"
            >
              Your browser does not support the video tag.
            </video>
            {/* Bottom-right badge */}
            <span className="video-duration-badge">5 Months <br /> Complete Program</span>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;