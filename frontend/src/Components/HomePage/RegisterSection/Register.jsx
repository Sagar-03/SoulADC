import React, { useRef, useState, useEffect } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './registersection.css';
import { Link } from "react-router-dom";

const Register = () => {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Start muted autoplay
    video.muted = true;
    video.volume = 0.7; // Set a comfortable volume level
    
    const startVideo = async () => {
      try {
        await video.play();
        console.log("Video started playing muted");
      } catch (err) {
        console.log("Muted autoplay blocked - waiting for user interaction:", err);
        // Don't worry if autoplay fails, user interaction will handle it
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
      // Ensure our state matches the video element
      setMuted(video.muted);
    };

    const handlePause = () => {
      console.log("Video paused");
      // Only try to resume if user has already interacted
      if (hasInteracted) {
        setTimeout(() => {
          if (video.paused && !video.ended) {
            video.play().catch(err => console.log("Auto-resume failed:", err));
          }
        }, 10);
      }
    };

    const handlePlay = () => {
      console.log("Video started playing");
    };

    video.addEventListener('volumechange', handleVolumeChange);
    video.addEventListener('loadeddata', handleLoadedData);
    video.addEventListener('pause', handlePause);
    video.addEventListener('play', handlePlay);

    // Simple and reliable user interaction handler
    const handleFirstInteraction = async () => {
      if (hasInteracted) return; // Prevent multiple triggers
      
      setHasInteracted(true);
      
      try {
        // Restart video from the beginning with sound
        video.currentTime = 0; // Reset to start
        video.muted = false;
        video.volume = 0.7; // Set to comfortable volume level
        setMuted(false);
        
        // Play the video from the beginning with sound
        await video.play();
        console.log("Video restarted from beginning with sound after user interaction");
        
        console.log("Video unmuted successfully with volume:", video.volume);
        console.log("Video muted state:", video.muted);
        console.log("Video paused state:", video.paused);
        console.log("Video current time:", video.currentTime);
      } catch (err) {
        console.log("Failed to restart video with sound:", err);
      }
      
      // Clean up listeners
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("scroll", handleFirstInteraction);
      document.removeEventListener("mousemove", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };

    // Add event listeners to document for better coverage
    document.addEventListener("click", handleFirstInteraction, { passive: true });
    document.addEventListener("scroll", handleFirstInteraction, { passive: true });
    document.addEventListener("mousemove", handleFirstInteraction, { passive: true });
    document.addEventListener("touchstart", handleFirstInteraction, { passive: true });

    return () => {
      // Clean up video event listeners
      video.removeEventListener('volumechange', handleVolumeChange);
      video.removeEventListener('loadeddata', handleLoadedData);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('play', handlePlay);
      
      // Clean up document event listeners
      document.removeEventListener("click", handleFirstInteraction);
      document.removeEventListener("scroll", handleFirstInteraction);
      document.removeEventListener("mousemove", handleFirstInteraction);
      document.removeEventListener("touchstart", handleFirstInteraction);
    };
  }, []); // Remove hasInteracted dependency to prevent re-running

  // Toggle button (manual)
  const toggleSound = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (muted) {
        // Unmuting
        const wasActuallyPaused = video.paused || video.ended;
        
        video.muted = false;
        video.volume = 0.7; // Set to comfortable volume level
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
};

export default Register;
