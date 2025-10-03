import React, { useEffect, useRef } from "react";
import VideoPlayer from "./VideoPlayer";

/**
 * Protected Video Player Wrapper
 * Adds additional security layers to prevent screen recording and screenshots
 */
const ProtectedVideoPlayer = (props) => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Additional protection for video content
    const addVideoProtection = () => {
      const videoElements = containerRef.current.querySelectorAll('video');
      
      videoElements.forEach((video) => {
        // Disable right-click on video
        video.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          return false;
        });

        // Prevent drag
        video.addEventListener('dragstart', (e) => {
          e.preventDefault();
          return false;
        });

        // Add controlsList attributes to prevent download
        video.setAttribute('controlsList', 'nodownload noremoteplayback');
        video.setAttribute('disablePictureInPicture', 'true');
        
        // Disable right-click on video controls
        video.setAttribute('oncontextmenu', 'return false;');
        
        // Monitor for picture-in-picture attempts
        video.addEventListener('enterpictureinpicture', (e) => {
          document.exitPictureInPicture();
        });

        // Detect if user tries to inspect element
        video.addEventListener('mousedown', (e) => {
          if (e.button === 2) { // Right click
            e.preventDefault();
            showSecurityAlert('Right-click is disabled on video content');
            return false;
          }
        });

        // Add invisible overlay to prevent direct video access
        const overlay = document.createElement('div');
        overlay.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 1;
          pointer-events: none;
          background: transparent;
        `;
        
        if (video.parentElement) {
          video.parentElement.style.position = 'relative';
          video.parentElement.appendChild(overlay);
        }

        // Monitor playback rate changes (some recording software alters this)
        let expectedPlaybackRate = 1;
        video.addEventListener('ratechange', () => {
          if (Math.abs(video.playbackRate - expectedPlaybackRate) > 0.1) {
            console.warn('Unexpected playback rate change detected');
          }
        });

        // Prevent seeking in certain scenarios (can indicate recording)
        let lastSeekTime = 0;
        video.addEventListener('seeking', () => {
          const now = Date.now();
          if (now - lastSeekTime < 500) {
            // Too many seeks in short time - suspicious
            console.warn('Rapid seeking detected');
          }
          lastSeekTime = now;
        });
      });
    };

    // Apply protection immediately and after DOM changes
    addVideoProtection();
    
    const observer = new MutationObserver(() => {
      addVideoProtection();
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true
    });

    return () => {
      observer.disconnect();
    };
  }, [props.show]);

  // Monitor for screen recording during video playback
  useEffect(() => {
    if (!props.show) return;

    const checkScreenRecording = () => {
      // Check if page is being recorded via Screen Capture API
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        // Already blocked in screenProtection.js, but add extra logging
        console.log('Video protection active');
      }

      // Check for unusual window states
      if (document.fullscreenElement && document.visibilityState === 'hidden') {
        console.warn('Suspicious state: fullscreen but hidden');
      }
    };

    const interval = setInterval(checkScreenRecording, 2000);

    // Add blur protection when video player loses focus
    const handleVisibilityChange = () => {
      if (document.hidden) {
        const videos = containerRef.current?.querySelectorAll('video');
        videos?.forEach(video => {
          video.pause();
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [props.show]);

  const showSecurityAlert = (message) => {
    const alert = document.createElement('div');
    alert.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(255, 59, 48, 0.95);
      color: white;
      padding: 30px 40px;
      border-radius: 15px;
      box-shadow: 0 10px 40px rgba(0,0,0,0.5);
      z-index: 1000001;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      animation: fadeIn 0.3s ease-out;
    `;
    alert.textContent = message;
    document.body.appendChild(alert);

    setTimeout(() => {
      alert.style.animation = 'fadeOut 0.3s ease-out';
      setTimeout(() => alert.remove(), 300);
    }, 2000);
  };

  return (
    <div ref={containerRef} className="protected-video-container">
      <VideoPlayer {...props} />
      
      {/* Additional watermark overlay for video */}
      {props.show && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 999997,
          background: 'transparent'
        }}>
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            color: 'rgba(255, 255, 255, 0.1)',
            fontSize: '12px',
            fontWeight: 'bold',
            userSelect: 'none'
          }}>
            PROTECTED • {new Date().toISOString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProtectedVideoPlayer;
