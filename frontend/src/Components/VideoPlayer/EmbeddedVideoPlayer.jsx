import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { GumletPlayer } from "@gumlet/react-embed-player";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./EmbeddedVideoPlayer.css";
import StudentLayout from "../student/StudentLayout";
import { api, getVideoMetadata, getStreamUrl, updateVideoProgress } from "../../Api/api";
import { toast } from 'react-toastify';
import {
  saveVideoProgress,
  getVideoProgress,
  markVideoCompleted,
  throttledSaveProgress,
} from "../../utils/videoProgress";

const EmbeddedVideoPlayer = () => {
  const { courseId, videoId } = useParams();
  const navigate = useNavigate();
  const playerRef = useRef(null);

  const [course, setCourse] = useState(null);
  const [currentVideo, setCurrentVideo] = useState({
    id: videoId || null,
    title: "",
    weekId: null,
    dayId: null,
    contentId: null,
  });
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showResumeNotification, setShowResumeNotification] = useState(false);
  const [savedProgress, setSavedProgress] = useState(null);
  const [hasResumed, setHasResumed] = useState(false);
  const [lastBackendUpdate, setLastBackendUpdate] = useState(0);

  // ─── Fetch course data + video metadata ───────────────────────────────────
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [courseRes, metadataRes] = await Promise.allSettled([
          courseId ? api.get(`/user/courses/${courseId}`) : Promise.resolve(null),
          videoId  ? getVideoMetadata(videoId)            : Promise.resolve(null),
        ]);

        // Course
        let courseData = null;
        if (courseRes.status === "fulfilled" && courseRes.value) {
          courseData = courseRes.value.data;
          setCourse(courseData);
        }

        // Find week/day context + title from course structure
        let weekId = null;
        let dayId  = null;
        let videoTitle = "Video Lesson";

        if (videoId && courseData) {
          outer: for (const week of courseData.weeks || []) {
            for (const day of week.days || []) {
              for (const content of day.contents || []) {
                if (
                  content.type === "video" &&
                  (String(content._id) === String(videoId) || content.asset_id === videoId)
                ) {
                  weekId     = week._id;
                  dayId      = day._id;
                  videoTitle = content.title || "Video Lesson";
                  setSelectedWeek(week.weekNumber);
                  break outer;
                }
              }
            }
          }
          if (!weekId && courseData.weeks?.length > 0) {
            setSelectedWeek(courseData.weeks[0].weekNumber);
          }
        }

        // Metadata (duration + confirmed title)
        if (metadataRes.status === "fulfilled" && metadataRes.value) {
          const meta = metadataRes.value.data;
          if (meta.duration > 0) setDuration(meta.duration);
          if (meta.title && meta.title !== "Video") videoTitle = meta.title;
        }

        setCurrentVideo({ id: videoId, title: videoTitle, weekId, dayId, contentId: videoId });
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || err.message);
      } finally {
        setLoading(false);
      }
    };

    setLoading(true);
    fetchData();
  }, [courseId, videoId]);

  // ─── Check saved progress ─────────────────────────────────────────────────
  useEffect(() => {
    if (courseId && videoId && !hasResumed) {
      const progress = getVideoProgress(courseId, videoId);
      if (progress && progress.currentTime > 30) {
        setSavedProgress(progress);
        setShowResumeNotification(true);
      }
    }
  }, [courseId, videoId, hasResumed]);

  // ─── PrintScreen block ────────────────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'PrintScreen' || e.keyCode === 44 || e.code === 'PrintScreen') {
        e.preventDefault();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ─── Progress helpers ─────────────────────────────────────────────────────
  const sendProgressToBackend = (currentSec, totalSec) => {
    if (!courseId || !videoId || totalSec <= 0) return;
    const progressData = {
      courseId,
      weekId:        currentVideo.weekId,
      dayId:         currentVideo.dayId,
      contentId:     currentVideo.contentId || videoId,
      videoTitle:    currentVideo.title,
      progress:      currentSec / totalSec,
      watchTime:     currentSec,
      totalDuration: totalSec,
    };
    updateVideoProgress(progressData).catch(() => {});
  };

  // ─── Gumlet Player event handlers ─────────────────────────────────────────
  const handleReady = () => {
    // Seek to saved position if user chose to resume
    if (savedProgress && hasResumed) {
      playerRef.current?.setCurrentTime(savedProgress.currentTime);
    }
  };

  const handlePlay = () => setIsPlaying(true);

  const handlePause = () => {
    setIsPlaying(false);
    if (courseId && videoId && duration > 0) {
      saveVideoProgress(courseId, videoId, currentTime, duration);
      sendProgressToBackend(currentTime, duration);
    }
  };

  const handleTimeupdate = ({ seconds, duration: dur }) => {
    setCurrentTime(seconds);
    if (dur > 0) setDuration(dur);

    if (courseId && videoId && dur > 0) {
      throttledSaveProgress(courseId, videoId, seconds, dur);

      // Send to backend every 10 s
      const now = Date.now();
      if (now - lastBackendUpdate > 10000) {
        setLastBackendUpdate(now);
        sendProgressToBackend(seconds, dur);
      }

      // Mark complete at 95 %
      if (seconds / dur >= 0.95) {
        markVideoCompleted(courseId, videoId, dur);
        sendProgressToBackend(dur, dur);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (courseId && videoId && duration > 0) {
      markVideoCompleted(courseId, videoId, duration);
      sendProgressToBackend(duration, duration);
      toast.success("Video completed! Progress saved.");
    }
  };

  // ─── Resume / start-over ──────────────────────────────────────────────────
  const handleResumeVideo = () => {
    playerRef.current?.setCurrentTime(savedProgress.currentTime);
    setHasResumed(true);
    setShowResumeNotification(false);
    setSavedProgress(null);
  };

  const handleStartFromBeginning = () => {
    playerRef.current?.setCurrentTime(0);
    setHasResumed(true);
    setShowResumeNotification(false);
    setSavedProgress(null);
  };

  // ─── Navigation ───────────────────────────────────────────────────────────
  const handleOpenContent = (content) => {
    if (content.type === "video") {
      if (!content.asset_id) {
        toast.error("Video asset is missing. Please contact support.");
        return;
      }
      navigate(`/student/course/${courseId}/video/${content.asset_id}`);
    } else if (content.type === "pdf" || content.type === "document") {
      window.open(getStreamUrl(content._id || content.s3Key), '_blank');
    }
  };

  const handleBackToCourse = () => navigate(`/student/course/${courseId}`);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <StudentLayout>
      <div className="video-player-page" style={{ userSelect: 'none' }}>
        <div className="container-fluid px-4">

          {/* Header */}
          <div className="video-header d-flex justify-content-between align-items-center mb-4">
            <div style={{ flex: 1, maxWidth: '70%' }}>
              <button className="btn btn-outline-secondary me-3" onClick={handleBackToCourse}>
                ← Back to Course
              </button>
              <h4 className="mb-0" style={{ display: 'inline-block', maxWidth: 'calc(100% - 150px)' }}>
                {currentVideo.title}
              </h4>
            </div>
            <div className="course-info">
              <small className="text-muted">{course?.title || "Course"}</small>
            </div>
          </div>

          {error && (
            <div className="alert alert-warning mb-4" role="alert">
              <small>{error}</small>
            </div>
          )}

          {/* Resume notification */}
          {showResumeNotification && savedProgress && (
            <div className="alert alert-info mb-4 d-flex justify-content-between align-items-center" role="alert">
              <div>
                <strong>Resume watching?</strong>
                <br />
                <small>
                  You were at {Math.floor(savedProgress.currentTime / 60)}:{String(Math.floor(savedProgress.currentTime % 60)).padStart(2, '0')}{" "}
                  ({savedProgress.percentage?.toFixed(1)}% completed)
                </small>
              </div>
              <div className="d-flex gap-2">
                <button className="btn btn-sm btn-success" onClick={handleResumeVideo}>Resume</button>
                <button className="btn btn-sm btn-outline-secondary" onClick={handleStartFromBeginning}>Start Over</button>
              </div>
            </div>
          )}

          <div className="row g-4">
            {/* Video area */}
            <div className="col-lg-8">
              <div className="video-container">
                <div className="video-wrapper" style={{ position: 'relative' }}>
                  {loading ? (
                    <div style={{
                      width: '100%', height: '450px', backgroundColor: '#1a1a1a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '8px',
                    }}>
                      <div style={{ textAlign: 'center', color: '#fff' }}>
                        <div className="spinner-border text-light mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                          <span className="visually-hidden">Loading...</span>
                        </div>
                        <div style={{ fontSize: '14px', opacity: 0.7 }}>Loading video...</div>
                      </div>
                    </div>
                  ) : videoId ? (
                    <GumletPlayer
                      ref={playerRef}
                      videoID={videoId}
                      title={currentVideo.title || "Video"}
                      style={{ position: "relative", paddingTop: "56.25%" }}
                      onReady={handleReady}
                      onPlay={handlePlay}
                      onPause={handlePause}
                      onTimeupdate={handleTimeupdate}
                      onEnded={handleEnded}
                      onError={(e) => console.error("Gumlet player error:", e)}
                    />
                  ) : (
                    <div style={{
                      width: '100%', height: '450px', backgroundColor: '#1a1a1a',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      borderRadius: '8px', color: '#fff', flexDirection: 'column',
                    }}>
                      <div style={{ fontSize: '18px', fontWeight: '500', marginBottom: '10px' }}>
                        Video is processing...
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.6 }}>Please check back shortly</div>
                    </div>
                  )}
                </div>

                {/* Stats bar */}
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
                </div>
              </div>
            </div>

            {/* Sidebar */}
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
                    />
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
                          <span className="week-toggle">{selectedWeek === week.weekNumber ? '−' : '+'}</span>
                        </div>
                        <div className="week-subtitle">{week.title || "Study Plan"}</div>
                      </div>

                      {selectedWeek === week.weekNumber && (
                        <div className="week-content">
                          {week.days?.map((day, dayIndex) => (
                            <div key={day._id || dayIndex} className="day-item">
                              <div className="day-header">
                                <small className="day-number">{day.dayNumber}</small>
                              </div>
                              <div className="day-contents">
                                {day.contents?.map((content, contentIndex) => (
                                  <button
                                    key={content._id || contentIndex}
                                    className={`content-btn ${
                                      (content.type === 'video'
                                        ? content.asset_id === currentVideo.id
                                        : content._id === currentVideo.id)
                                        ? 'active' : ''
                                    } ${content.type === 'video' ? 'video' : 'document'}`}
                                    onClick={() => handleOpenContent(content)}
                                    title={content.title || content.type}
                                  >
                                    <span className="content-icon">
                                      {content.type === 'video' ? '🎬' : '📄'}
                                    </span>
                                    <span className="content-title" style={{
                                      fontSize: '0.75rem', fontWeight: '500',
                                      overflow: 'hidden', textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap', maxWidth: '200px',
                                      display: 'inline-block',
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
  );
};

export default EmbeddedVideoPlayer;
