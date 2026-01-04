    import React, { useState, useRef, useEffect } from "react";
import { Modal } from "react-bootstrap";
import "./VideoPlayer.css";

const VideoPlayer = ({ show, onHide, videoId, videoTitle, videoSrc }) => {
  const videoRef = useRef(null);
  const progressRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showControls, setShowControls] = useState(true);
  const [buffered, setBuffered] = useState(0);

  // Control visibility timer
  const controlsTimeoutRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleLoadStart = () => setLoading(true);
    const handleLoadedData = () => {
      setLoading(false);
      setDuration(video.duration);
      // Set video to full volume on load
      video.volume = 1.0;
    };
    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleError = (e) => {
      setError("Failed to load video. Please try again.");
      setLoading(false);
      console.error("Video error:", e);
    };
    const handleProgress = () => {
      if (video.buffered.length > 0) {
        const bufferedEnd = video.buffered.end(video.buffered.length - 1);
        const duration = video.duration;
        if (duration > 0) {
          setBuffered((bufferedEnd / duration) * 100);
        }
      }
    };

    video.addEventListener("loadstart", handleLoadStart);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("error", handleError);
    video.addEventListener("progress", handleProgress);

    return () => {
      video.removeEventListener("loadstart", handleLoadStart);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("error", handleError);
      video.removeEventListener("progress", handleProgress);
    };
  }, [videoSrc]);

  // Auto-hide controls
  useEffect(() => {
    if (showControls && isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, isPlaying]);

  const togglePlayPause = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
    } else {
      video.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e) => {
    const video = videoRef.current;
    const progressBar = progressRef.current;
    if (!video || !progressBar) return;

    const rect = progressBar.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    video.currentTime = pos * duration;
  };

  const handleVolumeChange = (e) => {
    const video = videoRef.current;
    const newVolume = e.target.value;
    setVolume(newVolume);
    if (video) {
      video.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;

    if (!isFullscreen) {
      if (video.requestFullscreen) {
        video.requestFullscreen();
      } else if (video.webkitRequestFullscreen) {
        video.webkitRequestFullscreen();
      } else if (video.msRequestFullscreen) {
        video.msRequestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const changePlaybackSpeed = (speed) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const skipTime = (seconds) => {
    const video = videoRef.current;
    if (!video) return;
    
    video.currentTime = Math.max(0, Math.min(video.currentTime + seconds, duration));
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      if (!show) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          togglePlayPause();
          break;
        case "ArrowLeft":
          e.preventDefault();
          skipTime(-10);
          break;
        case "ArrowRight":
          e.preventDefault();
          skipTime(10);
          break;
        case "ArrowUp":
          e.preventDefault();
          setVolume(prev => Math.min(1, prev + 0.1));
          break;
        case "ArrowDown":
          e.preventDefault();
          setVolume(prev => Math.max(0, prev - 0.1));
          break;
        case "KeyM":
          e.preventDefault();
          toggleMute();
          break;
        case "KeyF":
          e.preventDefault();
          toggleFullscreen();
          break;
        default:
          break;
      }
    };

    document.addEventListener("keydown", handleKeyPress);
    return () => document.removeEventListener("keydown", handleKeyPress);
  }, [show, isPlaying, volume]);

  return (
    <Modal
      show={show}
      onHide={onHide}
      size="xl"
      centered
      className="video-player-modal"
    >
      <Modal.Header closeButton className="border-0">
        <Modal.Title>{videoTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="p-0">
        <div 
          className="video-container" 
          onMouseMove={handleMouseMove}
          onMouseLeave={() => isPlaying && setShowControls(false)}
        >
          {loading && (
            <div className="video-loading">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-2">Loading video...</p>
            </div>
          )}
          
          {error && (
            <div className="video-error">
              <div className="alert alert-danger" role="alert">
                <i className="fas fa-exclamation-triangle me-2"></i>
                {error}
              </div>
            </div>
          )}

          {videoSrc && (
            <video
              ref={videoRef}
              className="video-element"
              src={videoSrc}
              preload="metadata"
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onClick={togglePlayPause}
            />
          )}

          {/* Video Controls */}
          <div className={`video-controls ${showControls ? 'show' : ''}`}>
            {/* Progress Bar */}
            <div className="progress-container">
              <div 
                className="progress-bar" 
                ref={progressRef}
                onClick={handleSeek}
              >
                <div 
                  className="progress-buffered" 
                  style={{ width: `${buffered}%` }}
                ></div>
                <div 
                  className="progress-played" 
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                ></div>
                <div 
                  className="progress-thumb"
                  style={{ left: `${(currentTime / duration) * 100}%` }}
                ></div>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="controls-row">
              <div className="controls-left">
                <button
                  className="control-btn"
                  onClick={togglePlayPause}
                  title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                >
                  <i className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'}`}></i>
                </button>

                <button
                  className="control-btn"
                  onClick={() => skipTime(-10)}
                  title="Rewind 10s (←)"
                >
                  <i className="fas fa-backward"></i>
                </button>

                <button
                  className="control-btn"
                  onClick={() => skipTime(10)}
                  title="Forward 10s (→)"
                >
                  <i className="fas fa-forward"></i>
                </button>

                <div className="volume-controls">
                  <button
                    className="control-btn"
                    onClick={toggleMute}
                    title={isMuted ? "Unmute (M)" : "Mute (M)"}
                  >
                    <i className={`fas ${isMuted ? 'fa-volume-mute' : 'fa-volume-up'}`}></i>
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                  />
                </div>

                <div className="time-display">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
              </div>

              <div className="controls-right">
                <div className="speed-controls">
                  <select
                    value={playbackSpeed}
                    onChange={(e) => changePlaybackSpeed(parseFloat(e.target.value))}
                    className="speed-select"
                    title="Playback Speed"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>
                </div>

                <button
                  className="control-btn"
                  onClick={toggleFullscreen}
                  title="Fullscreen (F)"
                >
                  <i className="fas fa-expand"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
};

export default VideoPlayer;