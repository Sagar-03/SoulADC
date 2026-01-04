import React, { useRef, useState, useEffect, memo } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './registersection.css';
import { Link } from "react-router-dom";

const Register = memo(() => {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const hasInitialized = useRef(false); // Track if video has been initialized

  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasInitialized.current) return;

    // Mark as initialized to prevent re-initialization
    hasInitialized.current = true;

    // Start muted autoplay - only once on mount
    video.muted = true;
    video.volume = 1.0; // Set a comfortable volume level
    
    const startVideo = async () => {
      try {
        await video.play();
        console.log("Video started playing muted");
      } catch (err) {
        console.log("Muted autoplay blocked - waiting for user interaction:", err);
      }
    };

    // Only try autoplay if the video can play
    if (video.readyState >= 2) {
      startVideo();
    } else {
      video.addEventListener('canplay', startVideo, { once: true });
    }

    // Add video event listeners to monitor state changes
    const handleVolumeChange = () => {
      console.log("Volume changed - Volume:", video.volume, "Muted:", video.muted);
      setMuted(video.muted);
    };

    const handleLoadedData = () => {
      console.log("Video loaded - Volume:", video.volume, "Muted:", video.muted);
      setMuted(video.muted);
    };

    const handlePlay = () => {
      console.log("Video started playing");
    };

    const handleEnded = () => {
      console.log("Video ended, will loop automatically");
    };

    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('play', handlePlay);
    video.addEventListener('ended', handleEnded);

    return () => {
      // Clean up video event listeners
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('ended', handleEnded);
    };
  }, []); // Empty dependency array - only run once on mount

  // Handle popup interaction
  const handlePopupClick = async () => {
    const video = videoRef.current;
    if (!video) return;
    
    // First, close the popup and mark as interacted
    setShowPopup(false);
    setHasInteracted(true);
    
    // Small delay to ensure state updates
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Keep current playback position, just unmute
      const wasPlaying = !video.paused;
      
      video.muted = false;
      video.volume = 1.0;
      setMuted(false);
      
      // Ensure video continues playing
      if (!wasPlaying || video.paused) {
        await video.play();
      }
      
      console.log("Video unmuted with sound after popup interaction");
    } catch (err) {
      console.log("Failed to unmute video:", err);
    }
  };

  // Toggle button (manual)
  const toggleSound = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (muted) {
        // Unmuting
        const wasActuallyPaused = video.paused || video.ended;
        
        video.muted = false;
        video.volume = 1.0; // Set to full volume, users can adjust as needed
        setMuted(false);
        
        // Only play if actually paused
        if (wasActuallyPaused) {
          await video.play();
        }
        
        console.log("Manual unmute - Volume:", video.volume, "Muted:", video.muted, "Paused:", video.paused);
      } else {
        // Muting
        video.muted = true;
        setMuted(true);
        console.log("Manual mute - Volume:", video.volume, "Muted:", video.muted);
      }
    } catch (err) {
      console.log("Toggle sound failed:", err);
    }
  };

  const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg"
      width="20" height="20"
      viewBox="0 0 24 24"
      fill="none" stroke="#6B4226" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round"
      className="me-2">
      <path d="M9 12l2 2 4-4" />
      <path d="M21 12a9 9 0 1 1-3-6.7" />
    </svg>
  );

  return (
    <Container fluid className="register-section-container p-5">
      {/* Popup for user interaction - only closes when clicked */}
      {showPopup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '35px 45px',
              borderRadius: '15px',
              textAlign: 'center',
              maxWidth: '450px',
              boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
              position: 'relative',
            }}
          >
            {/* Cross button */}
            <button
              onClick={handlePopupClick}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                color: '#999',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => e.target.style.color = '#333'}
              onMouseLeave={(e) => e.target.style.color = '#999'}
            >
              ×
            </button>
            
            <h2 style={{ marginBottom: '20px', color: '#6B4226', fontWeight: '600' }}>
              Welcome, Learner! 🎓
            </h2>
            <p style={{ marginBottom: '15px', color: '#555', fontSize: '16px', lineHeight: '1.6' }}>
              We're thrilled to have you here! Your journey to mastering the ADC Part 1 exam starts now.
            </p>
            <p style={{ marginBottom: '0', color: '#666', fontSize: '15px', lineHeight: '1.6' }}>
              Explore our comprehensive courses, connect with expert mentors, and achieve your dental career goals in Australia.
            </p>
          </div>
        </div>
      )}
      
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
              playsInline
              className="video-main"
              controls={false}
              preload="auto"
            />
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
            Prepare with a structured 5- or 10-month program designed to help you build a strong foundation for success in the ADC Part 1 exam and your future dental career in Australia.
          </p>
          <ul className="list-unstyled mb-4 register-text">
            <li className="mb-1"><CheckIcon /> Personalised one-on-one mentor support</li>
            <li className="mb-1"><CheckIcon /> Comprehensive, structured, and easy-to-follow curriculum</li>
            <li className="mb-1"><CheckIcon /> Daily progress tracking</li>
            <li className="mb-1"><CheckIcon /> Subject-specific, topic-wise detailed video sessions with clear explanations</li>
            <li className="mb-1"><CheckIcon /> Access to recent research articles and reference books</li>
            <li className="mb-1"><CheckIcon /> Mock papers and question banks to help you master exam-style scenarios</li>
          </ul>

          <Button
            as={Link}
            to="/courses"
            variant="dark"
            className="me-3 px-4 py-2 register-button-dark"
          >
            Start Your Journey
          </Button>
        </Col>
      </Row>
    </Container>
  );
});

// Set display name for debugging
Register.displayName = 'Register';

export default Register;