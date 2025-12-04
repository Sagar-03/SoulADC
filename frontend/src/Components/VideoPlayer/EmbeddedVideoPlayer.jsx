import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./EmbeddedVideoPlayer.css";
import StudentLayout from "../student/StudentLayout";
import { api, getStreamUrl, updateVideoProgress } from "../../Api/api";
import { toast } from 'react-toastify';
import ScreenshotWarning from "../common/ScreenshotWarning";
import {
  saveVideoProgress,
  getVideoProgress,
  markVideoCompleted,
  throttledSaveProgress,
  cleanupOldProgress
} from "../../utils/videoProgress";

// Static data for fallback
const staticWeeks = Array.from({ length: 7 }, (_, w) => ({
  week: w + 1,
  days: [
    { type: "Video", title: `Day 1: Lesson ${w + 1}.1` },
    { type: "Video", title: `Day 2: Lesson ${w + 1}.2` },
    { type: "Video", title: `Day 3: Lesson ${w + 1}.3` },
    { type: "Video", title: `Day 4: Lesson ${w + 1}.4` },
    { type: "Video", title: `Day 5: Lesson ${w + 1}.5` },
    { type: "Quiz", title: `Day 6: Practice Quiz ${w + 1}` },
    { type: "Mock", title: `Day 7: Mock Test ${w + 1}` },
  ],
}));

const EmbeddedVideoPlayer = () => {
  const { courseId, videoId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [currentVideo, setCurrentVideo] = useState({
    id: videoId || null,
    title: "",
    src: "",
    weekId: null,
    dayId: null,
    contentId: null
  });
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isBlurred, setIsBlurred] = useState(false);
  const [showResumeNotification, setShowResumeNotification] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const [hasResumed, setHasResumed] = useState(false);
  const [lastBackendUpdate, setLastBackendUpdate] = useState(0);
  const [showScreenshotWarning, setShowScreenshotWarning] = useState(false);
  const [screenshotCount, setScreenshotCount] = useState(0);

  // Fetch course data and video info
  useEffect(() => {
    const fetchCourseAndVideo = async () => {
      try {
        if (courseId) {
          const { data: courseData } = await api.get(`/user/courses/${courseId}`);
          setCourse(courseData);
        }

        if (videoId) {
          try {
            const { data: videoInfo } = await api.get(`/stream/info/${videoId}`);
            
            // Find weekId and dayId from course data
            let weekId = null;
            let dayId = null;
            
            if (courseId) {
              const { data: courseData } = await api.get(`/user/courses/${courseId}`);
              setCourse(courseData);
              
              // Find the week and day that contains this video
              outer: for (const week of courseData.weeks || []) {
                if (week.days) {
                  for (const day of week.days) {
                    if (day.contents) {
                      for (const content of day.contents) {
                        if (String(content._id) === String(videoId) || content.s3Key === videoId) {
                          weekId = week._id;
                          dayId = day._id;
                          console.log("📹 Found video metadata:", {
                            weekId,
                            dayId,
                            contentId: videoId,
                            weekNumber: week.weekNumber,
                            dayNumber: day.dayNumber
                          });
                          break outer;
                        }
                      }
                    }
                  }
                }
              }
            }
            
            setCurrentVideo({
              id: videoId,
              title: videoInfo.title || "Video Lesson",
              src: getStreamUrl(videoId),
              weekId: weekId,
              dayId: dayId,
              contentId: videoId
            });
            
            console.log("✅ Video loaded:", {
              title: videoInfo.title,
              hasWeekId: !!weekId,
              hasDayId: !!dayId,
              courseId: courseId
            });
          } catch (err) {
            console.error("⚠️ Failed to load video metadata:", err);
            setCurrentVideo({
              id: videoId,
              title: "Video Lesson",
              src: getStreamUrl(videoId),
              weekId: null,
              dayId: null,
              contentId: videoId
            });
          }
        }

      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || err.message);
        
        // Fallback to demo data
        setCourse({
          title: "ADC Part 1 Course",
          weeks: staticWeeks.map(w => ({
            weekNumber: w.week,
            title: `Week ${w.week} Content`,
            days: w.days.map((day, idx) => ({
              dayNumber: idx + 1,
              title: day.title,
              contents: [{
                type: day.type.toLowerCase(),
                title: day.title,
                _id: `sample-${day.type.toLowerCase()}-${w.week}-${idx + 1}`,
                s3Key: `sample-${day.type.toLowerCase()}-${w.week}-${idx + 1}`
              }]
            }))
          }))
        });

        if (videoId) {
          setCurrentVideo({
            id: videoId,
            title: "Sample Video Lesson",
            src: "/video.mp4",
          });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourseAndVideo();
    
    // Cleanup old progress on component mount
    cleanupOldProgress();
  }, [courseId, videoId]);

  // Check for saved progress when video is ready
  useEffect(() => {
    if (courseId && videoId && !hasResumed) {
      const progress = getVideoProgress(courseId, videoId);
      if (progress && progress.currentTime > 30) {
        setSavedProgress(progress);
        setShowResumeNotification(true);
      }
    }
  }, [courseId, videoId, hasResumed]);

  // Handle resume from saved position
  const handleResumeVideo = () => {
    const video = videoRef.current;
    if (video && savedProgress) {
      video.currentTime = savedProgress.currentTime;
      setHasResumed(true);
      setShowResumeNotification(false);
      setSavedProgress(null);
    }
  };

  // Handle start from beginning
  const handleStartFromBeginning = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
      setHasResumed(true);
      setShowResumeNotification(false);
      setSavedProgress(null);
    }
  };


  // Anti-screenshot mechanism: Blur only on non-alphanumeric key press
  useEffect(() => {
    let screenshotDetectionTimeout = null;

    const handleScreenshotAttempt = () => {
      setScreenshotCount(prev => prev + 1);
      setShowScreenshotWarning(true);
      setIsBlurred(true);
      
      // Log the attempt (you can send this to backend)
      console.warn('Screenshot attempt detected at:', new Date().toISOString());
    };

    const handleKeyDown = (e) => {
      // Detect Print Screen key (works in some browsers)
      if (e.key === 'PrintScreen' || e.keyCode === 44 || e.code === 'PrintScreen') {
        e.preventDefault();
        handleScreenshotAttempt();
        return;
      }

      // Detect Windows Snipping Tool (Win + Shift + S)
      if (e.key === 's' && e.shiftKey && e.metaKey) {
        e.preventDefault();
        handleScreenshotAttempt();
        return;
      }

      // Detect Mac screenshot shortcuts
      if (e.metaKey && e.shiftKey && ['3', '4', '5'].includes(e.key)) {
        e.preventDefault();
        handleScreenshotAttempt();
        return;
      }

      // Ignore letters (a-z, A-Z) and numbers (0-9) for normal blur
      if (/^[a-zA-Z0-9]$/.test(e.key)) return;

      setIsBlurred(true);
    };

    const handleKeyUp = (e) => {
      if (!/^[a-zA-Z0-9]$/.test(e.key)) {
        setIsBlurred(false);
      }
    };

    // Monitor clipboard for screenshot paste attempts
    const handleCopy = (e) => {
      console.warn('Copy event detected');
      handleScreenshotAttempt();
    };

    // Blur when user switches tab/window
    const handleWindowBlur = () => {
      setIsBlurred(true);
      // Trigger immediately for instant detection
      handleScreenshotAttempt();
    };

    const handleWindowFocus = () => {
      setIsBlurred(false);
      if (screenshotDetectionTimeout) {
        clearTimeout(screenshotDetectionTimeout);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsBlurred(true);
        // Trigger immediately for instant detection
        handleScreenshotAttempt();
      } else {
        setIsBlurred(false);
        if (screenshotDetectionTimeout) {
          clearTimeout(screenshotDetectionTimeout);
        }
      }
    };

    // Disable right-click
    const handleContextMenu = (e) => {
      e.preventDefault();
      handleScreenshotAttempt();
      return false;
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('copy', handleCopy);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('focus', handleWindowFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('contextmenu', handleContextMenu);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('copy', handleCopy);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      if (screenshotDetectionTimeout) {
        clearTimeout(screenshotDetectionTimeout);
      }
    };
  }, [currentVideo.id]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.setAttribute('controlsList', 'nodownload noremoteplayback');
    video.setAttribute('disablePictureInPicture', 'true');

    const preventRightClick = (e) => {
      e.preventDefault();
      setIsBlurred(true);
      setTimeout(() => setIsBlurred(false), 2000);
      return false;
    };

    const preventDrag = (e) => {
      e.preventDefault();
      return false;
    };

    video.addEventListener('contextmenu', preventRightClick);
    video.addEventListener('dragstart', preventDrag);

    const handleTimeUpdate = () => {
      const currentVideoTime = video.currentTime;
      const videoDuration = video.duration;
      setCurrentTime(currentVideoTime);
      
      // Save progress to localStorage (throttled)
      if (courseId && videoId && videoDuration > 0) {
        throttledSaveProgress(courseId, videoId, currentVideoTime, videoDuration);
        
        // Send progress to backend every 10 seconds
        const now = Date.now();
        if (now - lastBackendUpdate > 10000) {
          setLastBackendUpdate(now);
          
          const progressData = {
            courseId: courseId,
            weekId: currentVideo.weekId,
            dayId: currentVideo.dayId,
            contentId: currentVideo.contentId || videoId,
            videoTitle: currentVideo.title,
            progress: currentVideoTime / videoDuration,
            watchTime: currentVideoTime,
            totalDuration: videoDuration
          };
          
          console.log("📊 Sending progress to backend:", {
            progress: `${(progressData.progress * 100).toFixed(1)}%`,
            time: `${Math.floor(currentVideoTime)}s / ${Math.floor(videoDuration)}s`,
            courseId,
            videoId
          });
          
          // Send to backend asynchronously (don't wait for response)
          updateVideoProgress(progressData)
            .then(() => {
              console.log("✅ Progress saved successfully");
            })
            .catch(err => {
              console.error("❌ Failed to update progress on backend:", err);
              console.error("Error details:", err.response?.data || err.message);
            });
        }
        
        // Mark as completed if watched 95% or more
        if ((currentVideoTime / videoDuration) >= 0.95) {
          markVideoCompleted(courseId, videoId, videoDuration);
          
          console.log("🎉 Video completed! Sending final update...");
          
          // Send final completion update to backend
          const completionData = {
            courseId: courseId,
            weekId: currentVideo.weekId,
            dayId: currentVideo.dayId,
            contentId: currentVideo.contentId || videoId,
            videoTitle: currentVideo.title,
            progress: 1.0,
            watchTime: videoDuration,
            totalDuration: videoDuration
          };
          
          updateVideoProgress(completionData)
            .then(() => {
              console.log("✅ Video marked as completed on backend");
              toast.success("Video completed! Progress saved.");
            })
            .catch(err => {
              console.error("❌ Failed to mark video as completed on backend:", err);
            });
        }
      }
    };

    const handleLoadedData = () => {
      setDuration(video.duration);
      
      // Auto-resume if there's saved progress and user hasn't made a choice yet
      if (savedProgress && !hasResumed && !showResumeNotification) {
        setTimeout(() => {
          setShowResumeNotification(true);
        }, 1000); // Show notification after 1 second
      }
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      
      // Save progress when video is paused
      if (courseId && videoId && video.duration > 0) {
        saveVideoProgress(courseId, videoId, video.currentTime, video.duration);
        
        // Also send to backend
        const progressData = {
          courseId: courseId,
          weekId: currentVideo.weekId,
          dayId: currentVideo.dayId,
          contentId: currentVideo.contentId || videoId,
          videoTitle: currentVideo.title,
          progress: video.currentTime / video.duration,
          watchTime: video.currentTime,
          totalDuration: video.duration
        };
        
        updateVideoProgress(progressData).catch(err => {
          console.error("Failed to update progress on pause:", err);
        });
      }
    };

    // Save progress when user leaves the page
    const handleBeforeUnload = () => {
      if (courseId && videoId && video.duration > 0) {
        saveVideoProgress(courseId, videoId, video.currentTime, video.duration);
        
        // Send final progress to backend (synchronous for page unload)
        const progressData = {
          courseId: courseId,
          weekId: currentVideo.weekId,
          dayId: currentVideo.dayId,
          contentId: currentVideo.contentId || videoId,
          videoTitle: currentVideo.title,
          progress: video.currentTime / video.duration,
          watchTime: video.currentTime,
          totalDuration: video.duration
        };
        
        // Use sendBeacon for reliable delivery on page unload
        const blob = new Blob([JSON.stringify(progressData)], { type: 'application/json' });
        navigator.sendBeacon(`${api.defaults.baseURL}/user/video-progress`, blob);
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      video.removeEventListener('contextmenu', preventRightClick);
      video.removeEventListener('dragstart', preventDrag);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [currentVideo.src, currentVideo.weekId, currentVideo.dayId, currentVideo.contentId, currentVideo.title, courseId, videoId, savedProgress, hasResumed, showResumeNotification, lastBackendUpdate]);

  const handleOpenContent = (content) => {
    const id = content._id || content.s3Key;

    if (content.type === "video") {
      navigate(`/student/course/${courseId}/video/${id}`);
    } else if (content.type === "pdf" || content.type === "document") {
      window.open(getStreamUrl(id), '_blank');
    } else {
      alert(`Opening ${content.type}: ${content.title}`);
    }
  };

  const handleBackToCourse = () => {
    navigate(`/student/course/${courseId}`);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleReloadPage = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="d-flex justify-content-center align-items-center" style={{ height: "400px" }}>
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </StudentLayout>
    );
  }

  return (
    <>
      {/* Screenshot Warning Modal - Outside StudentLayout for proper z-index */}
      <ScreenshotWarning 
        show={showScreenshotWarning}
        screenshotCount={screenshotCount}
        onReload={handleReloadPage}
      />

      <StudentLayout>
        <div className="video-player-page" style={{ userSelect: 'none' }}>
          <div className="container-fluid px-4">
          <div className="video-header d-flex justify-content-between align-items-center mb-4">
            <div style={{ flex: 1, maxWidth: '70%' }}>
              <button
                className="btn btn-outline-secondary me-3"
                onClick={handleBackToCourse}
              >
                ← Back to Course
              </button>
              <h4 className="mb-0" style={{ display: 'inline-block', maxWidth: 'calc(100% - 150px)' }}>{currentVideo.title}</h4>
            </div>
            <div className="course-info">
              <small className="text-muted">{course?.title || "Course"}</small>
            </div>
          </div>

          {error && (
            <div className="alert alert-warning mb-4" role="alert">
              <small>⚠️ Using demo data. {error}</small>
            </div>
          )}

          {/* Resume Video Notification */}
          {showResumeNotification && savedProgress && (
            <div className="alert alert-info mb-4 d-flex justify-content-between align-items-center" role="alert">
              <div>
                <strong>🕐 Resume watching?</strong>
                <br />
                <small>
                  You were at {Math.floor(savedProgress.currentTime / 60)}:{(savedProgress.currentTime % 60).toFixed(0).padStart(2, '0')} 
                  ({savedProgress.percentage.toFixed(1)}% completed)
                </small>
              </div>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-sm btn-success"
                  onClick={handleResumeVideo}
                >
                  Resume
                </button>
                <button 
                  className="btn btn-sm btn-outline-secondary"
                  onClick={handleStartFromBeginning}
                >
                  Start Over
                </button>
              </div>
            </div>
          )}

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="video-container">
                <div 
                  className="video-wrapper" 
                  style={{ 
                    position: 'relative',
                    transition: 'filter 0.3s ease',
                    filter: isBlurred ? 'blur(20px)' : 'blur(0px)'
                  }}
                >
                  {currentVideo.src && (
                    <video
                      ref={videoRef}
                      src={currentVideo.src}
                      controls
                      className="main-video"
                      poster=""
                      controlsList="nodownload noremoteplayback"
                      disablePictureInPicture
                      onContextMenu={(e) => e.preventDefault()}
                      style={{ 
                        width: '100%',
                        pointerEvents: 'auto'
                      }}
                    />
                  )}
                  
                  {/* Blur overlay when suspicious activity detected */}
                  {isBlurred && (
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      backgroundColor: 'rgba(0, 0, 0, 0.8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      zIndex: 100,
                      pointerEvents: 'none'
                    }}>
                      <div style={{ 
                        color: 'white', 
                        fontSize: '24px', 
                        fontWeight: 'bold',
                        textAlign: 'center',
                        padding: '20px'
                      }}>
                        🔒 Content Protected<br/>
                        <small style={{ fontSize: '14px' }}>Activity detected and logged</small>
                      </div>
                    </div>
                  )}
                </div>

                <div className="video-info mt-3">
                  <h5>{currentVideo.title}</h5>
                  <div className="video-stats d-flex gap-4 text-muted">
                    <span>Duration: {formatTime(duration)}</span>
                    <span>Current: {formatTime(currentTime)}</span>
                    <span>Status: {isPlaying ? 'Playing' : 'Paused'}</span>
                    {duration > 0 && (
                      <span>Progress: {((currentTime / duration) * 100).toFixed(1)}%</span>
                    )}
                  </div>
                  <div className="mt-2">
                    <small className="text-warning">
                      ⚠️ This content is protected. Screenshots are monitored and logged.
                    </small>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="course-sidebar">
                <h6 className="sidebar-title mb-3">Course Content</h6>

                <div className="progress-info mb-4">
                  <div className="d-flex justify-content-between mb-2">
                    <small>Progress</small>
                    <small>Week {selectedWeek} of {course?.weeks?.length || 7}</small>
                  </div>
                  <div className="progress">
                    <div
                      className="progress-bar"
                      style={{ width: `${((selectedWeek / (course?.weeks?.length || 7)) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="weeks-accordion">
                  {course?.weeks?.map((week, index) => (
                    <div key={week._id || index} className="week-item mb-3">
                      <div
                        className={`week-header ${selectedWeek === week.weekNumber ? 'active' : ''}`}
                        onClick={() => setSelectedWeek(week.weekNumber)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="week-title">Module {week.weekNumber}</span>
                          <span className="week-toggle">
                            {selectedWeek === week.weekNumber ? '−' : '+'}
                          </span>
                        </div>
                        <div className="week-subtitle">{week.title || "Study Plan"}</div>
                      </div>

                      {selectedWeek === week.weekNumber && (
                        <div className="week-content">
                          {week.days?.map((day, dayIndex) => (
                            <div key={day._id || dayIndex} className="day-item">
                              <div className="day-header">
                                <small className="day-number">Day {day.dayNumber}</small>
                              </div>
                              <div className="day-contents">
                                {day.contents?.map((content, contentIndex) => (
                                  <button
                                    key={content._id || contentIndex}
                                    className={`content-btn ${content._id === currentVideo.id || content.s3Key === currentVideo.id ? 'active' : ''
                                      } ${content.type === 'video' ? 'video' : 'document'}`}
                                    onClick={() => handleOpenContent(content)}
                                    title={content.title || `${content.type} content`}
                                  >
                                    <span className="content-icon">
                                      {content.type === 'video' ? '🎬' : '📄'}
                                    </span>
                                    <span className="content-title" style={{
                                      fontSize: '0.75rem',
                                      fontWeight: '500',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: '200px',
                                      display: 'inline-block'
                                    }}>
                                      {content.title || content.type}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StudentLayout>
    </>
  );
};

export default EmbeddedVideoPlayer;
