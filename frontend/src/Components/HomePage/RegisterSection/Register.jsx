import React, { useRef, useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './registersection.css';
import { Link } from "react-router-dom";

const Register = () => {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);

  const toggleSound = () => {
    const video = videoRef.current;
    if (video) {
      video.muted = !video.muted;
      setMuted(video.muted);
    }
  };

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

  return (
    <Container fluid className="register-section-container p-5">
      <Row className="g-5 align-items-center">
        <Col
          md={6}
          className="d-flex flex-column justify-content-center align-items-center position-relative"
        >
          <div className="video-player-container position-relative">
            <video
              ref={videoRef}
              src="/video.mp4"
              autoPlay
              loop
              muted={muted}
              playsInline
              className="video-main"
            />
            {/* Toggle Sound Button */}
            <button
              onClick={toggleSound}
              className="sound-toggle-btn"
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '10px',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                border: 'none',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                cursor: 'pointer',
              }}
            >
              {muted ? '🔇' : '🔊'}
            </button>
          </div>
        </Col>

        <Col md={6}>
          <h1 className="register-title">
            Master the <span className="gradient-text-adc">ADC Part 1</span> with Expert Guidance
          </h1>
          <p className="lead register-text fw-4">
            Prepare with a structured 5- or 10-month program designed to help you build a strong foundation for success in the ADC Part 1 exam and your future dental career in Australia.          </p>

          <ul className="list-unstyled mb-4 register-text">
            <li className="mb-2"><CheckIcon /> Personalised one-on-one mentor support</li>
            <li className="mb-2"><CheckIcon /> Comprehensive, structured, and easy-to-follow curriculum</li>
            <li><CheckIcon /> Daily progress tracking
            </li>
            <li className="mb-2"><CheckIcon />Subject-specific, topic-wise detailed video sessions with clear explanations
            </li>
            <li className="mb-2"><CheckIcon />Access to recent research articles and reference books aligned with ADC requirements
            </li>
            <li className="mb-2"><CheckIcon />Mock papers and question banks to help you master exam-style scenarios</li>
          </ul>

          <Button
            as={Link}
            to="/courses"   // your target route
            variant="dark"
            className="me-3 px-4 py-2 register-button-dark"
          >
            Start Your Journey
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default Register;
