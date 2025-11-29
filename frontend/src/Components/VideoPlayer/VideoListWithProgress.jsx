import React, { useState, useEffect } from "react";
import { FaPlay, FaCheck, FaClock, FaEye, FaPlayCircle } from "react-icons/fa";
import { MdPlayArrow, MdPause, MdVideoLibrary } from "react-icons/md";
import { getCourseProgress } from "../../Api/api";
import "./videoListProgress.css";

const VideoListWithProgress = ({ 
  courseId, 
  videos = [], 
  onVideoSelect, 
  currentVideoId 
}) => {
  const [videoProgress, setVideoProgress] = useState({});
  const [sortBy, setSortBy] = useState("order"); // order, progress, unwatched
  const [filterBy, setFilterBy] = useState("all"); // all, completed, in-progress, not-started

  useEffect(() => {
    if (courseId) {
      loadVideoProgress();
    }
  }, [courseId]);

  const loadVideoProgress = async () => {
    try {
      const { data } = await getCourseProgress(courseId);
      setVideoProgress(data.videoProgress || {});
    } catch (error) {
      console.error("Failed to load video progress:", error);
      // Load from localStorage as fallback
      const localProgress = {};
      videos.forEach(video => {
        const saved = localStorage.getItem(`video_${courseId}_${video.id}`);
        if (saved) {
          localProgress[video.id] = JSON.parse(saved);
        }
      });
      setVideoProgress(localProgress);
    }
  };

  const getVideoStatus = (videoId) => {
    const progress = videoProgress[videoId];
    if (!progress || progress.percentage < 5) return "not-started";
    if (progress.percentage >= 95) return "completed";
    return "in-progress";
  };

  const getProgressPercentage = (videoId) => {
    return videoProgress[videoId]?.percentage || 0;
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatLastWatched = (timestamp) => {
    if (!timestamp) return null;
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
    return date.toLocaleDateString();
  };

  const getSortedAndFilteredVideos = () => {
    let filteredVideos = videos.filter(video => {
      if (filterBy === "all") return true;
      return getVideoStatus(video.id) === filterBy;
    });

    return filteredVideos.sort((a, b) => {
      switch (sortBy) {
        case "progress":
          return getProgressPercentage(b.id) - getProgressPercentage(a.id);
        case "unwatched":
          return getProgressPercentage(a.id) - getProgressPercentage(b.id);
        case "order":
        default:
          return (a.order || 0) - (b.order || 0);
      }
    });
  };

  const getStatusIcon = (videoId) => {
    const status = getVideoStatus(videoId);
    switch (status) {
      case "completed":
        return <FaCheck className="status-icon completed" />;
      case "in-progress":
        return <MdPause className="status-icon in-progress" />;
      case "not-started":
      default:
        return <FaPlay className="status-icon not-started" />;
    }
  };

  const getStatusBadge = (videoId) => {
    const status = getVideoStatus(videoId);
    const statusLabels = {
      "completed": "Watched",
      "in-progress": "In Progress",
      "not-started": "Not Started"
    };
    return (
      <span className={`status-badge ${status}`}>
        {statusLabels[status]}
      </span>
    );
  };

  return (
    <div className="video-list-container">
      {/* Controls */}
      <div className="video-list-controls">
        <div className="control-group">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
            className="control-select"
          >
            <option value="order">Default Order</option>
            <option value="progress">Progress (High to Low)</option>
            <option value="unwatched">Unwatched First</option>
          </select>
        </div>
        <div className="control-group">
          <label>Filter:</label>
          <select 
            value={filterBy} 
            onChange={(e) => setFilterBy(e.target.value)}
            className="control-select"
          >
            <option value="all">All Videos</option>
            <option value="not-started">Not Started</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {/* Video List */}
      <div className="video-list">
        {getSortedAndFilteredVideos().map((video, index) => {
          const progress = getProgressPercentage(video.id);
          const status = getVideoStatus(video.id);
          const isActive = video.id === currentVideoId;
          const lastWatched = formatLastWatched(videoProgress[video.id]?.lastWatchedAt);

          return (
            <div
              key={video.id}
              className={`video-item ${isActive ? "active" : ""} ${status}`}
              onClick={() => onVideoSelect(video)}
            >
              {/* Video Thumbnail */}
              <div className="video-icon-container">
                <div className="video-icon-large">
                  {getStatusIcon(video.id)}
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {video.duration && (
                  <div className="duration-badge">
                    <FaClock /> {formatDuration(video.duration)}
                  </div>
                )}
              </div>

              {/* Video Info */}
              <div className="video-info">
                <div className="video-header">
                  <h4 className="video-title">{video.title}</h4>
                  {getStatusBadge(video.id)}
                </div>
                
                <div className="video-meta">
                  <span className="video-number">
                    Video {index + 1}
                  </span>
                  {video.duration && (
                    <>
                      <span className="meta-separator">•</span>
                      <span className="duration">
                        <FaClock /> {formatDuration(video.duration)}
                      </span>
                    </>
                  )}
                  {progress > 0 && (
                    <>
                      <span className="meta-separator">•</span>
                      <span className="progress-text">
                        {Math.round(progress)}% watched
                      </span>
                    </>
                  )}
                </div>

                {video.description && (
                  <p className="video-description">
                    {video.description}
                  </p>
                )}

                {lastWatched && (
                  <div className="last-watched">
                    <FaEye /> Last watched {lastWatched}
                  </div>
                )}

                {/* Progress Details */}
                {progress > 0 && (
                  <div className="progress-details">
                    <div className="progress-bar-detailed">
                      <div 
                        className="progress-fill-detailed"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <span className="progress-percentage">
                      {Math.round(progress)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Action Button */}
              <div className="video-actions">
                <button className="play-button">
                  {status === "completed" ? (
                    <><FaPlay /> Rewatch</>
                  ) : status === "in-progress" ? (
                    <><MdPlayArrow /> Continue</>
                  ) : (
                    <><FaPlay /> Start</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {getSortedAndFilteredVideos().length === 0 && (
        <div className="no-videos">
          <p>No videos found for the selected filter.</p>
        </div>
      )}

      {/* Summary Stats */}
      <div className="video-list-summary">
        <div className="summary-stat">
          <span className="stat-label">Total Videos:</span>
          <span className="stat-value">{videos.length}</span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Completed:</span>
          <span className="stat-value">
            {videos.filter(v => getVideoStatus(v.id) === "completed").length}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">In Progress:</span>
          <span className="stat-value">
            {videos.filter(v => getVideoStatus(v.id) === "in-progress").length}
          </span>
        </div>
        <div className="summary-stat">
          <span className="stat-label">Remaining:</span>
          <span className="stat-value">
            {videos.filter(v => getVideoStatus(v.id) === "not-started").length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default VideoListWithProgress;