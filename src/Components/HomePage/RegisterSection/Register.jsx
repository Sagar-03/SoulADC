import React, { useRef, useState } from "react";
import "./registersection.css"; // Import external CSS file
import video from "../../../assets/video.mp4";

// Background Decoration Component
const BackgroundDecorations = () => {
  return (
    <div className="background-decorations">
      <i className="fas fa-search decoration-icon icon-1"></i>
      <i className="fas fa-ruler decoration-icon icon-2"></i>
      <i className="fas fa-lightbulb decoration-icon icon-3"></i>
      <i className="fas fa-flask decoration-icon icon-4"></i>
      <i className="fas fa-cog decoration-icon icon-5"></i>
      <i className="fas fa-graduation-cap decoration-icon icon-6"></i>
      <i className="fas fa-atom decoration-icon icon-7"></i>
      <i className="fas fa-calculator decoration-icon icon-8"></i>
      <i className="fas fa-compass decoration-icon icon-9"></i>
      <i className="fas fa-pencil decoration-icon icon-10"></i>
    </div>
  );
};

// Video Player with Unmute Button
const VideoPlayer = () => {
  const videoRef = useRef(null);
  // State to track if the video is muted
  const [isMuted, setIsMuted] = useState(true);

  // Function to toggle mute/unmute
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(!isMuted);
    }
  };


 return (
    <div className="video-frame">
      <video
        ref={videoRef}
        src={video}
        autoPlay
        loop
        muted // Start muted to allow autoplay
        playsInline
        className="video-main"
      ></video>
      
      {/* Mute/Unmute Button */}
      <button onClick={toggleMute} className="unmute-button">
        {isMuted ? (
          <i className="fas fa-volume-mute"></i>
        ) : (
          <i className="fas fa-volume-up"></i>
        )}
      </button>
    </div>
  );
};

// Main Registration Form Component
const RegisterSection = () => {
  return (
    <div className="register-section">
      <BackgroundDecorations />
      <main className="register-container">
        <div className="grid-layout">
          {/* Left Side: Form */}
          <div className="form-column">
            <div className="form-header">
              <h2 className="form-title">Ace Your Dental Exam</h2>
              <p className="form-subtitle">
                Master dental studies with our comprehensive learning platform.
                Join thousands of successful students today.
              </p>
            </div>

            <div className="form-inputs">
              <div className="input-wrapper">
                <i className="fas fa-user input-icon"></i>
                <input
                  type="text"
                  placeholder="Username"
                  className="form-control"
                />
              </div>

              <div className="input-wrapper">
                <i className="fas fa-lock input-icon"></i>
                <input
                  type="password"
                  placeholder="Password"
                  className="form-control"
                />
              </div>

              <div className="input-wrapper">
                <i className="fas fa-envelope input-icon"></i>
                <input
                  type="email"
                  placeholder="E-mail"
                  className="form-control"
                />
              </div>
            </div>

            <button className="register-btn">
              Register
              <div className="register-btn-icon">
                <i className="fas fa-arrow-right"></i>
              </div>
            </button>
          </div>

          {/* Right Side: Video instead of Image */}
          <div className="image-column">
            <VideoPlayer />
          </div>
        </div>
      </main>
    </div>
  );
};

export default RegisterSection;
