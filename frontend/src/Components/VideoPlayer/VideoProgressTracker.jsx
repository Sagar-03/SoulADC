import React, { useState, useEffect } from "react";
import { updateVideoProgress } from "../../Api/api";

/**
 * VideoProgressTracker Component
 * Tracks video watch time and progress, sends updates to backend
 */
const VideoProgressTracker = ({ 
  courseId, 
  videoId, 
  duration, 
  onProgressUpdate,
  children 
}) => {
  const [watchedDuration, setWatchedDuration] = useState(0);
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [lastUpdateTime, setLastUpdateTime] = useState(0);

  useEffect(() => {
    // Load saved progress from localStorage or API
    const savedProgress = localStorage.getItem(`video_${courseId}_${videoId}`);
    if (savedProgress) {
      const progress = JSON.parse(savedProgress);
      setWatchedDuration(progress.watchedDuration || 0);
      setProgressPercentage(progress.percentage || 0);
    }
  }, [courseId, videoId]);

  const updateProgress = async (currentTime) => {
    if (!duration || duration === 0) return;

    const newPercentage = Math.min((currentTime / duration) * 100, 100);
    const newWatchedDuration = Math.max(currentTime, watchedDuration);

    setWatchedDuration(newWatchedDuration);
    setProgressPercentage(newPercentage);

    // Save to localStorage
    const progressData = {
      watchedDuration: newWatchedDuration,
      percentage: newPercentage,
      lastWatchedAt: new Date().toISOString()
    };
    localStorage.setItem(`video_${courseId}_${videoId}`, JSON.stringify(progressData));

    // Update parent component
    if (onProgressUpdate) {
      onProgressUpdate(progressData);
    }

    // Send to backend every 10 seconds or on significant progress
    const now = Date.now();
    if (now - lastUpdateTime > 10000 || newPercentage - progressPercentage > 5) {
      try {
        await updateVideoProgress(courseId, videoId, {
          watchedDuration: newWatchedDuration,
          percentage: newPercentage,
          duration: duration,
          lastWatchedAt: new Date().toISOString()
        });
        setLastUpdateTime(now);
      } catch (error) {
        console.error("Failed to update video progress:", error);
      }
    }
  };

  // Clone children and pass progress tracking props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onTimeUpdate: updateProgress,
        initialProgress: progressPercentage,
        watchedDuration: watchedDuration
      });
    }
    return child;
  });

  return <>{enhancedChildren}</>;
};

export default VideoProgressTracker;