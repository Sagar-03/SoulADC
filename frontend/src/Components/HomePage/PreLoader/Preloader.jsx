import React, { useEffect, useState, useRef, memo } from "react";
import "./Preloader.css";

const Preloader = memo(({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;

    const finish = () => {
      setFadeOut(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 0);
    };

    // Fallback: always show home after 6 seconds regardless of video
    const fallbackTimer = setTimeout(finish, 6000);

    if (!video) return () => clearTimeout(fallbackTimer);

    // Auto-play the video (try muted first for autoplay policy)
    video.muted = true;
    video.volume = 1.0;

    const startVideo = async () => {
      try {
        await video.play();
      } catch (err) {
        // If autoplay fails entirely, finish immediately
        clearTimeout(fallbackTimer);
        finish();
      }
    };

    if (video.readyState >= 2) {
      startVideo();
    } else {
      video.addEventListener('canplay', startVideo, { once: true });
    }

    // When video ends, finish preloader
    const handleVideoEnd = () => {
      clearTimeout(fallbackTimer);
      finish();
    };

    // If video fails to load, finish immediately
    const handleError = () => {
      clearTimeout(fallbackTimer);
      finish();
    };

    video.addEventListener('ended', handleVideoEnd);
    video.addEventListener('error', handleError);

    return () => {
      clearTimeout(fallbackTimer);
      video.removeEventListener('ended', handleVideoEnd);
      video.removeEventListener('error', handleError);
    };
  }, [onFinish]);

  if (!isVisible) return null;

  return (
    <div className={`preloader ${fadeOut ? 'fade-out' : ''}`}>
      <video 
        ref={videoRef}
        className="preloader-video"
        playsInline
        preload="auto"
      >
      <source src="/starting_video.MP4" type="video/MP4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
});

Preloader.displayName = 'Preloader';

export default Preloader;
