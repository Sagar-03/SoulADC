import React, { useEffect, useState, useRef, memo } from "react";
import "./Preloader.css";

const Preloader = memo(({ onFinish }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Auto-play the video
    video.muted = false; // Play with sound
    video.volume = 1.0;
    
    const startVideo = async () => {
      try {
        await video.play();
        console.log("Starting video playing");
      } catch (err) {
        console.log("Video autoplay error:", err);
        // If autoplay fails, try muted
        video.muted = true;
        video.play().catch(e => console.log("Muted autoplay also failed:", e));
      }
    };

    if (video.readyState >= 2) {
      startVideo();
    } else {
      video.addEventListener('canplay', startVideo, { once: true });
    }

    // When video ends, start fade out then hide preloader
    const handleVideoEnd = () => {
      setFadeOut(true);
      setTimeout(() => {
        setIsVisible(false);
        if (onFinish) onFinish();
      }, 0); // Wait for fade out animation to complete
    };

    video.addEventListener('ended', handleVideoEnd);

    return () => {
      video.removeEventListener('ended', handleVideoEnd);
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
        <source src="/starting_video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
});

Preloader.displayName = 'Preloader';

export default Preloader;
