import React, { useRef, useState, useEffect, memo } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './registersection.css';
import { Link } from "react-router-dom";
import logo from "../../../assets/logo.png";
import { submitDiscountEmail } from "../../../Api/api";

const Register = memo(() => {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [showPopup, setShowPopup] = useState(true);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  // Handle popup close and unmute video
  const closePopupAndUnmute = async () => {
    const video = videoRef.current;
    setShowPopup(false);
    setHasInteracted(true);
    if (!video) return;
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      const wasPlaying = !video.paused;
      video.muted = false;
      video.volume = 1.0;
      setMuted(false);
      if (!wasPlaying || video.paused) await video.play();
    } catch (err) {
      console.log("Failed to unmute video:", err);
    }
  };

  const handleDiscountSubmit = async (e) => {
    e.preventDefault();
    if (!email || isSubmitting) return;
    setSubmitError('');
    setIsSubmitting(true);

    try {
      await submitDiscountEmail(email.trim());
      setSubmitted(true);
      setTimeout(() => closePopupAndUnmute(), 1500);
    } catch (err) {
      console.error('Discount lead failed:', err);
      setSubmitError('We could not submit your request right now. Please try again.');
    } finally {
      setIsSubmitting(false);
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
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.65)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 9999, padding: '16px',
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '20px',
            maxWidth: '680px', width: '100%',
            boxShadow: '0 20px 60px rgba(107,66,38,0.25)',
            position: 'relative',
            display: 'flex', overflow: 'hidden',
            minHeight: '440px',
          }}>
            {/* Close button */}
            <button onClick={closePopupAndUnmute} style={{
              position: 'absolute', top: '14px', right: '14px',
              background: 'rgba(107,66,38,0.1)', border: 'none',
              borderRadius: '50%', width: '32px', height: '32px',
              cursor: 'pointer', color: '#7B563D', fontSize: '18px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              zIndex: 2, transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(107,66,38,0.2)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(107,66,38,0.1)'}
            >×</button>

            {/* Left content */}
            <div style={{ flex: 1, padding: '40px 36px 40px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center', zIndex: 1 }}>
              {/* Logo */}
              <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                <img src={logo} alt="SoulADC" style={{ height: '70px', width: 'auto' }} />
              </div>

              {submitted ? (
                <div style={{ textAlign: 'center', padding: '10px 0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
                  <p style={{ color: '#7B563D', fontWeight: '600', fontSize: '1.1rem', margin: 0 }}>You're in! Check your email for your discount code you will receive soon.</p>
                </div>
              ) : (
                <>
                  <h2 style={{ color: '#4a2c10', fontWeight: '800', fontSize: '1.85rem', margin: '0 0 8px', lineHeight: 1.2 }}>
                    Want 5% OFF?
                  </h2>
                  <p style={{ color: '#6b4c30', fontSize: '0.95rem', margin: '0 0 24px', lineHeight: 1.5 }}>
                    Join SoulADC and receive{' '}
                    <span style={{ color: '#A98C6A', fontWeight: '700' }}>5% OFF</span>{' '}
                    your first course registration.
                  </p>

                  <form onSubmit={handleDiscountSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <input
                      type="email"
                      placeholder="Enter your email address"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      style={{
                        padding: '13px 16px',
                        borderRadius: '10px',
                        border: '1.5px solid #d9c4aa',
                        fontSize: '0.95rem',
                        outline: 'none',
                        background: '#fff',
                        color: '#333',
                        width: '100%',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => e.target.style.borderColor = '#A98C6A'}
                      onBlur={e => e.target.style.borderColor = '#d9c4aa'}
                    />
                    {submitError && (
                      <p style={{ color: '#b00020', margin: 0, fontSize: '0.88rem' }}>
                        {submitError}
                      </p>
                    )}
                    <button type="submit" style={{
                      background: 'linear-gradient(135deg, #A98C6A, #7B563D)',
                      color: '#fff', border: 'none',
                      borderRadius: '10px', padding: '13px',
                      fontSize: '1rem', fontWeight: '700',
                      cursor: isSubmitting ? 'not-allowed' : 'pointer', width: '100%',
                      opacity: isSubmitting ? 0.7 : 1,
                      transition: 'opacity 0.2s',
                    }}
                      disabled={isSubmitting}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                      {isSubmitting ? 'Submitting...' : 'Get Discount'}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Right — person image */}
            <div style={{
              width: '300px', flexShrink: 0, position: 'relative',
              overflow: 'hidden',
            }}>
              <img
                src="/image.jpeg"
                alt="SoulADC mentor"
                style={{
                  position: 'absolute', bottom: 0, right: 0,
                  height: '105%', width: 'auto',
                  objectFit: 'cover', objectPosition: 'top center',
                  filter: 'drop-shadow(-8px 0 16px rgba(107,66,38,0.12))',
                }}
              />
            </div>
          </div>
        </div>
      )}
      
      <Row className="g-4 g-md-5 align-items-center">
        <Col
          md={6}
          className="d-flex flex-column justify-content-center align-items-center position-relative order-2 order-md-1"
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

        <Col md={6} className="order-1 order-md-2">
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