/**
 * Video Progress Tracking Utility
 * Manages video playback position storage and retrieval from localStorage
 */

const VIDEO_PROGRESS_PREFIX = 'video_progress_';
const SAVE_INTERVAL = 2000; // Save progress every 2 seconds

/**
 * Generate a unique key for storing video progress
 * @param {string} courseId - Course identifier
 * @param {string} videoId - Video identifier
 * @returns {string} - Storage key
 */
const getVideoProgressKey = (courseId, videoId) => {
  return `${VIDEO_PROGRESS_PREFIX}${courseId}_${videoId}`;
};

/**
 * Save video progress to localStorage
 * @param {string} courseId - Course identifier
 * @param {string} videoId - Video identifier
 * @param {number} currentTime - Current video time in seconds
 * @param {number} duration - Total video duration in seconds
 * @param {boolean} completed - Whether video is completed
 */
/**
 * Handle localStorage quota exceeded error
 */
const handleStorageQuotaExceeded = () => {
  console.warn('LocalStorage quota exceeded. Cleaning up old video progress...');
  
  try {
    // Get all video progress entries with timestamps
    const progressEntries = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(VIDEO_PROGRESS_PREFIX)) {
        const progressData = JSON.parse(localStorage.getItem(key));
        progressEntries.push({
          key,
          lastWatched: new Date(progressData.lastWatched),
          completed: progressData.completed
        });
      }
    }
    
    // Sort by oldest first, prioritize completed videos for removal
    progressEntries.sort((a, b) => {
      if (a.completed && !b.completed) return -1;
      if (!a.completed && b.completed) return 1;
      return a.lastWatched - b.lastWatched;
    });
    
    // Remove oldest 25% of entries
    const toRemove = Math.ceil(progressEntries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      localStorage.removeItem(progressEntries[i].key);
    }
    
    console.log(`Removed ${toRemove} old video progress entries to free up space`);
    
  } catch (error) {
    console.error('Failed to clean up storage:', error);
    // As last resort, clear all video progress
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(VIDEO_PROGRESS_PREFIX)) {
        keys.push(key);
      }
    }
    keys.forEach(key => localStorage.removeItem(key));
    console.warn('Cleared all video progress due to storage cleanup failure');
  }
};

export const saveVideoProgress = (courseId, videoId, currentTime, duration, completed = false) => {
  if (!courseId || !videoId || currentTime < 0) return;
  
  const key = getVideoProgressKey(courseId, videoId);
  const progressData = {
    currentTime: Math.floor(currentTime),
    duration: Math.floor(duration),
    completed,
    lastWatched: new Date().toISOString(),
    percentage: duration > 0 ? Math.min((currentTime / duration) * 100, 100) : 0
  };
  
  try {
    localStorage.setItem(key, JSON.stringify(progressData));
  } catch (error) {
    if (error.name === 'QuotaExceededError' || error.code === 22) {
      handleStorageQuotaExceeded();
      // Try saving again after cleanup
      try {
        localStorage.setItem(key, JSON.stringify(progressData));
      } catch (retryError) {
        console.error('Failed to save video progress even after cleanup:', retryError);
      }
    } else {
      console.error('Failed to save video progress:', error);
    }
  }
};

/**
 * Get video progress from localStorage
 * @param {string} courseId - Course identifier
 * @param {string} videoId - Video identifier
 * @returns {Object|null} - Progress data or null if not found
 */
export const getVideoProgress = (courseId, videoId) => {
  if (!courseId || !videoId) return null;
  
  const key = getVideoProgressKey(courseId, videoId);
  
  try {
    const storedData = localStorage.getItem(key);
    if (!storedData) return null;
    
    const progressData = JSON.parse(storedData);
    
    // Return null for completed videos or if progress is at the very end
    if (progressData.completed || progressData.percentage >= 95) {
      return null;
    }
    
    // Don't resume if less than 30 seconds watched
    if (progressData.currentTime < 30) {
      return null;
    }
    
    return progressData;
  } catch (error) {
    console.error('Failed to retrieve video progress:', error);
    return null;
  }
};

/**
 * Mark video as completed
 * @param {string} courseId - Course identifier
 * @param {string} videoId - Video identifier
 * @param {number} duration - Total video duration
 */
export const markVideoCompleted = (courseId, videoId, duration) => {
  saveVideoProgress(courseId, videoId, duration, duration, true);
};

/**
 * Remove video progress (useful when video is completed or reset)
 * @param {string} courseId - Course identifier
 * @param {string} videoId - Video identifier
 */
export const clearVideoProgress = (courseId, videoId) => {
  if (!courseId || !videoId) return;
  
  const key = getVideoProgressKey(courseId, videoId);
  
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Failed to clear video progress:', error);
  }
};

/**
 * Get all video progress for a course
 * @param {string} courseId - Course identifier
 * @returns {Object} - Object with videoId as keys and progress data as values
 */
export const getCourseVideoProgress = (courseId) => {
  if (!courseId) return {};
  
  const progressMap = {};
  const prefix = `${VIDEO_PROGRESS_PREFIX}${courseId}_`;
  
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(prefix)) {
        const videoId = key.replace(prefix, '');
        const progressData = JSON.parse(localStorage.getItem(key));
        progressMap[videoId] = progressData;
      }
    }
  } catch (error) {
    console.error('Failed to retrieve course video progress:', error);
  }
  
  return progressMap;
};

/**
 * Clean up old video progress (older than 30 days)
 */
export const cleanupOldProgress = () => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  try {
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(VIDEO_PROGRESS_PREFIX)) {
        const progressData = JSON.parse(localStorage.getItem(key));
        const lastWatched = new Date(progressData.lastWatched);
        
        if (lastWatched < thirtyDaysAgo) {
          keysToRemove.push(key);
        }
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    if (keysToRemove.length > 0) {
      console.log(`Cleaned up ${keysToRemove.length} old video progress records`);
    }
  } catch (error) {
    console.error('Failed to cleanup old progress:', error);
  }
};

/**
 * Throttle function to limit how often we save progress
 */
let saveTimeout = null;
export const throttledSaveProgress = (courseId, videoId, currentTime, duration) => {
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  
  saveTimeout = setTimeout(() => {
    saveVideoProgress(courseId, videoId, currentTime, duration);
  }, SAVE_INTERVAL);
};

/**
 * Get storage usage statistics
 * @returns {Object} Storage usage info
 */
export const getStorageStats = () => {
  try {
    let totalSize = 0;
    let videoProgressCount = 0;
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const value = localStorage.getItem(key);
      totalSize += key.length + value.length;
      
      if (key && key.startsWith(VIDEO_PROGRESS_PREFIX)) {
        videoProgressCount++;
      }
    }
    
    return {
      totalKeys: localStorage.length,
      videoProgressCount,
      totalSizeKB: Math.round(totalSize / 1024 * 100) / 100,
      estimatedQuotaUsage: Math.round(totalSize / (5 * 1024 * 1024) * 100) // Assuming 5MB quota
    };
  } catch (error) {
    console.error('Failed to get storage stats:', error);
    return null;
  }
};

