import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "./EmbeddedVideoPlayer.css";
import StudentLayout from "../student/StudentaLayout";
import { api, getStreamUrl } from "../../Api/api";

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
    src: ""
  });
  const [selectedWeek, setSelectedWeek] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Fetch course data and video info
  useEffect(() => {
    const fetchCourseAndVideo = async () => {
      try {
        // Fetch course data
        if (courseId) {
          const { data: courseData } = await api.get(`/user/courses/${courseId}`);
          setCourse(courseData);
        }

        // Fetch video info
        if (videoId) {
          try {
            const { data: videoInfo } = await api.get(`/stream/info/${videoId}`);
            setCurrentVideo({
              id: videoId,
              title: videoInfo.title || "Video Lesson",
              src: getStreamUrl(videoId),
            });
          } catch {
            // Fallback to direct streaming if info fetch fails
            setCurrentVideo({
              id: videoId,
              title: "Video Lesson",
              src: getStreamUrl(videoId),
            });
          }
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        setError(err.response?.data?.message || err.message);

        // Optional fallback static data
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
            src: "/video.mp4", // fallback
          });
        }
      } finally {
        setLoading(false);
      }
    };


    fetchCourseAndVideo();
  }, [courseId, videoId]);

  // Handle video events
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => setCurrentTime(video.currentTime);
    const handleLoadedData = () => setDuration(video.duration);
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);

    return () => {
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
    };
  }, [currentVideo.src]);

  // Handle content opening
  const handleOpenContent = (content) => {
    const id = content._id || content.s3Key;

    if (content.type === "video") {
      // Navigate to the video player page
      navigate(`/student/course/${courseId}/video/${id}`);
    } else if (content.type === "pdf" || content.type === "document") {
      // Open document in new tab
      window.open(getStreamUrl(id), '_blank');
    } else {
      alert(`Opening ${content.type}: ${content.title}`);
    }
  };

  // Go back to course
  const handleBackToCourse = () => {
    navigate(`/student/course/${courseId}`);
  };

  // Format time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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
    <StudentLayout>
      <div className="video-player-page">
        <div className="container-fluid px-4">
          {/* Header */}
          <div className="video-header d-flex justify-content-between align-items-center mb-4">
            <div>
              <button
                className="btn btn-outline-secondary me-3"
                onClick={handleBackToCourse}
              >
                ← Back to Course
              </button>
              <h4 className="mb-0 d-inline">{currentVideo.title}</h4>
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

          {/* Main Content */}
          <div className="row g-4">
            {/* Left: Video Player */}
            <div className="col-lg-8">
              <div className="video-container">
                <div className="video-wrapper">
                  <video
                    ref={videoRef}
                    src={currentVideo.src}
                    controls
                    className="main-video"
                    poster=""
                    onLoadStart={() => console.log('Video loading started')}
                    onError={(e) => console.error('Video error:', e)}
                  />
                </div>

                {/* Video Info */}
                <div className="video-info mt-3">
                  <h5>{currentVideo.title}</h5>
                  <div className="video-stats d-flex gap-4 text-muted">
                    <span>Duration: {formatTime(duration)}</span>
                    <span>Current: {formatTime(currentTime)}</span>
                    <span>Status: {isPlaying ? 'Playing' : 'Paused'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Course Content */}
            <div className="col-lg-4">
              <div className="course-sidebar">
                <h6 className="sidebar-title mb-3">Course Content</h6>

                {/* Course Progress */}
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

                {/* Weeks Accordion */}
                <div className="weeks-accordion">
                  {course?.weeks?.map((week, index) => (
                    <div key={week._id || index} className="week-item mb-3">
                      <div
                        className={`week-header ${selectedWeek === week.weekNumber ? 'active' : ''}`}
                        onClick={() => setSelectedWeek(week.weekNumber)}
                      >
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="week-title">Week {week.weekNumber}</span>
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
                                <div className="day-title">{day.title}</div>
                              </div>
                              <div className="day-contents">
                                {day.contents?.map((content, contentIndex) => (
                                  <button
                                    key={content._id || contentIndex}
                                    className={`content-btn ${content._id === currentVideo.id || content.s3Key === currentVideo.id ? 'active' : ''
                                      } ${content.type === 'video' ? 'video' : 'document'}`}
                                    onClick={() => handleOpenContent(content)}
                                  >
                                    <span className="content-icon">
                                      {content.type === 'video' ? '🎬' : '📄'}
                                    </span>
                                    <span className="content-type">{content.type}</span>
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