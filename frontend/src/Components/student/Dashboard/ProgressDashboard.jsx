import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  FaPlay, 
  FaClock, 
  FaTrophy, 
  FaFire, 
  FaChevronRight,
  FaCheck,
  FaEye,
  FaPlayCircle
} from "react-icons/fa";
import { BiTargetLock } from "react-icons/bi";
import { MdVideoLibrary, MdAccessTime } from "react-icons/md";
import StudentLayout from "../StudentLayout";
import { getPurchasedCourses, getUserStreak, getProgressDashboard } from "../../../Api/api";
import { getUser } from "../../../utils/auth";
import { getCourseVideoProgress, getVideoProgress, getStorageStats } from "../../../utils/videoProgress";
import "./progressDashboard.css";

const ProgressDashboard = () => {
  const navigate = useNavigate();
  const [purchasedCourses, setPurchasedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [streakData, setStreakData] = useState({
    current: 0,
    highest: 0,
    lastLoginDate: null
  });
  const [progressData, setProgressData] = useState({
    totalProgress: 0,
    totalWatchedHours: 0,
    totalVideosCompleted: 0,
    remainingHours: 0,
    weeklyWatchTime: [0, 0, 0, 0, 0, 0, 0],
    totalVideos: 0,
    totalCourses: 0
  });

  const [recentActivity, setRecentActivity] = useState([]);
  const [videoProgress, setVideoProgress] = useState({});
  const [resumableVideos, setResumableVideos] = useState([]);

  const [milestones, setMilestones] = useState([]);

  // Calculate milestones based on real progress
  const calculateMilestones = (progressData, streakData) => {
    return [
      {
        id: 1,
        title: "First Video",
        icon: "🎬",
        completed: progressData.totalVideosCompleted >= 1
      },
      {
        id: 2,
        title: "10 Videos Watched",
        icon: "📚",
        completed: progressData.totalVideosCompleted >= 10
      },
      {
        id: 3,
        title: "First Course 50%",
        icon: "🎯",
        completed: progressData.totalProgress >= 50
      },
      {
        id: 4,
        title: "Week Streak",
        icon: "🔥",
        completed: streakData.current >= 7 || streakData.highest >= 7
      },
      {
        id: 5,
        title: "Study Champion",
        icon: "🏆",
        completed: progressData.totalWatchedHours >= 20
      },
      {
        id: 6,
        title: "Course Completion",
        icon: "🎓",
        completed: progressData.totalProgress >= 100
      },
      {
        id: 7,
        title: "Learning Ninja",
        icon: "🥷",
        completed: progressData.totalVideosCompleted >= 50
      },
      {
        id: 8,
        title: "Consistency King",
        icon: "👑",
        completed: streakData.highest >= 30
      }
    ];
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Check if user has streak data from login
        const user = getUser();
        let streakFromLogin = null;
        if (user && user.streak) {
          // Check if streak should be reset due to inactivity
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const lastLoginDate = user.streak.lastLoginDate ? new Date(user.streak.lastLoginDate) : null;
          
          if (lastLoginDate) {
            lastLoginDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.floor((today - lastLoginDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff > 1 && user.streak.current > 0) {
              // Reset current streak but keep highest
              streakFromLogin = {
                ...user.streak,
                current: 0
              };
            } else {
              streakFromLogin = user.streak;
            }
          } else {
            streakFromLogin = user.streak;
          }
          
          setStreakData(streakFromLogin);
        }

        const [coursesResponse, streakResponse, progressResponse] = await Promise.all([
          getPurchasedCourses(),
          // Only fetch streak from API if not available from login
          streakFromLogin ? Promise.resolve({ data: streakFromLogin }) : getUserStreak(),
          getProgressDashboard()
        ]);
        
        console.log(' Progress Dashboard Data:', {
          courses: coursesResponse.data,
          streak: streakResponse.data,
          progress: progressResponse.data
        });
        
        // Handle both old and new API response formats
        const coursesData = coursesResponse.data?.approvedCourses || 
                           coursesResponse.data?.allCourses || 
                           (Array.isArray(coursesResponse.data) ? coursesResponse.data : []);
        
        setPurchasedCourses(coursesData);
        setStreakData(streakResponse.data || { current: 0, highest: 0, lastLoginDate: null });
        
        // Set real progress data
        if (progressResponse.data) {
          console.log('✅ Setting progress data:', progressResponse.data);
          setProgressData(progressResponse.data);
          setRecentActivity(progressResponse.data.recentActivity || []);
          
          // Calculate milestones based on actual progress
          const calculatedMilestones = calculateMilestones(
            progressResponse.data, 
            streakResponse.data || { current: 0, highest: 0 }
          );
          setMilestones(calculatedMilestones);
        } else {
          console.warn('⚠️ No progress data received from API');
        }

        // Fetch video progress for all purchased courses
        const allVideoProgress = {};
        const resumableVideosList = [];
        
        for (const course of coursesData) {
          const courseProgress = getCourseVideoProgress(course._id);
          allVideoProgress[course._id] = courseProgress;
          
          // Find resumable videos (not completed, watched > 30 seconds, < 95% complete)
          Object.entries(courseProgress).forEach(([videoId, progress]) => {
            if (!progress.completed && progress.currentTime > 30 && progress.percentage < 95) {
              // Find the actual video name from course structure
              let videoName = progress.title || '';
              if (!videoName || videoName.startsWith('Video ')) {
                // Search through course weeks/days/contents to find the video name
                course.weeks?.forEach(week => {
                  week.days?.forEach(day => {
                    day.contents?.forEach(content => {
                      if (content.type === 'video' && content._id === videoId) {
                        videoName = content.title || content.name || videoName;
                      }
                    });
                  });
                });
              }
              
              resumableVideosList.push({
                courseId: course._id,
                courseTitle: course.title,
                videoId,
                videoTitle: videoName || `Video ${videoId}`,
                currentTime: progress.currentTime,
                duration: progress.duration,
                percentage: progress.percentage,
                lastWatched: progress.lastWatched
              });
            }
          });
        }
        
        // Sort resumable videos by last watched (most recent first)
        resumableVideosList.sort((a, b) => new Date(b.lastWatched) - new Date(a.lastWatched));
        
        setVideoProgress(allVideoProgress);
        setResumableVideos(resumableVideosList.slice(0, 5)); // Show top 5 most recent
        
      } catch (err) {
        console.error("Error fetching data:", err);
        // If streak API fails, keep default values
        if (err.response?.status !== 401) {
          setStreakData({ current: 0, highest: 0, lastLoginDate: null });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return date.toLocaleDateString();
  };

  const formatVideoTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResumeVideo = (courseId, videoId) => {
    navigate(`/student/course/${courseId}/video/${videoId}`);
  };

  const CircularProgress = ({ percentage, size = 120, strokeWidth = 8 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="circular-progress-container">
        <svg width={size} height={size} className="circular-progress">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e6e6e6"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="linear-gradient(145deg, #A98C6A, #7B563D)"
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="progress-circle"
          />
        </svg>
        <div className="progress-text">
          <span className="progress-percentage">{percentage}%</span>
          <span className="progress-label">Complete</span>
        </div>
      </div>
    );
  };

  const WeeklyChart = ({ data }) => {
    const maxValue = Math.max(...data);
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    return (
      <div className="weekly-chart">
        <div className="chart-bars">
          {data.map((hours, index) => (
            <div key={index} className="bar-container">
              <div 
                className="bar"
                style={{ height: `${(hours / maxValue) * 100}%` }}
                data-tooltip={`${hours}h`}
              />
              <span className="day-label">{days[index]}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading your progress...</p>
        </div>
      </StudentLayout>
    );
  }

  const user = getUser();
  const userName = user?.name || user?.email?.split('@')[0] || 'Student';

  return (
    <StudentLayout>
      <div className="progress-dashboard">
        {/* Header */}
        <div className="dashboard-header">
          <div className="welcome-message">
            <h2 className="greeting-text">Hi {userName}, Welcome! 👋</h2>
          </div>
          <h1 className="dashboard-title">Your Learning Progress</h1>
          <p className="dashboard-subtitle">Track your journey and stay motivated!</p>
        </div>

        {/* Main Stats Grid */}
        <div className="stats-grid">
          {/* Overall Progress */}
          <div className="stat-card main-progress">
            <div className="card-header">
              <h3><BiTargetLock /> Overall Progress</h3>
            </div>
            <div className="progress-display">
              <CircularProgress percentage={progressData.totalProgress} />
              <div className="progress-details">
                <div className="stat-item">
                  <MdVideoLibrary className="stat-icon" />
                  <span>{progressData.totalVideosCompleted} videos completed</span>
                </div>
                <div className="stat-item">
                  <MdAccessTime className="stat-icon" />
                  <span>{progressData.totalWatchedHours}h watched</span>
                </div>
                <div className="stat-item">
                  <FaClock className="stat-icon" />
                  <span>{progressData.remainingHours}h remaining</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weekly Activity */}
          {/* <div className="stat-card">
            <div className="card-header">
              <h3><FaFire /> Weekly Activity</h3>
            </div>
            <WeeklyChart data={progressData.weeklyWatchTime} />
            <div className="activity-stats">
              <div className="activity-stat">
                <FaFire className="streak-icon" />
                <div>
                  <span className="stat-number">{streakData.current}</span>
                  <span className="stat-label">Day Streak</span>
                </div>
              </div>
              <div className="activity-stat">
                <FaTrophy className="trophy-icon" />
                <div>
                  <span className="stat-number">{streakData.highest}</span>
                  <span className="stat-label">Best Streak</span>
                </div>
              </div>
            </div>
          </div> */}

          {/* Resume Watching */}
          <div className="stat-card continue-learning">
            <div className="card-header">
              <h3><FaPlayCircle /> Resume Watching</h3>
            </div>
            {resumableVideos.length > 0 ? (
              <div className="resume-section">
                <div className="video-card featured">
                  <div className="video-icon">
                    <FaPlayCircle className="play-icon-large" />
                  </div>
                  <div className="video-info">
                    <h4>{resumableVideos[0].videoTitle}</h4>
                    <p className="course-name">{resumableVideos[0].courseTitle}</p>
                    <div className="video-meta">
                      <span className="duration">
                        <FaClock /> {formatVideoTime(resumableVideos[0].currentTime)} / {formatVideoTime(resumableVideos[0].duration)}
                      </span>
                      <span className="last-watched">
                        <FaEye /> {formatTime(resumableVideos[0].lastWatched)}
                      </span>
                    </div>
                    <div className="progress-bar-simple">
                      <div 
                        className="progress-fill-simple"
                        style={{ width: `${resumableVideos[0].percentage}%` }}
                      />
                      <span className="progress-text-simple">
                        {Math.round(resumableVideos[0].percentage)}% complete
                      </span>
                    </div>
                    <button 
                      className="resume-btn"
                      onClick={() => handleResumeVideo(resumableVideos[0].courseId, resumableVideos[0].videoId)}
                    >
                      <FaPlay /> Resume Watching
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="no-recent-activity">
                <FaPlayCircle className="empty-icon" />
                <p>Start watching videos to see your recent progress here!</p>
                <button 
                  className="browse-courses-btn"
                  onClick={() => navigate("/Dashboard")}
                >
                  Browse My Courses
                </button>
              </div>
            )}
          </div>

          {/* Learning Streak */}
          <div className="stat-card learning-streak-card">
            <div className="card-header">
              <h3><FaFire /> Learning Streak</h3>
              {streakData.lastLoginDate && (
                <span className="last-login-small">
                  {new Date(streakData.lastLoginDate).toLocaleDateString()}
                </span>
              )}
            </div>
            <div className="streak-compact">
              <div className="streak-box">
                <div className="streak-icon-circle current">
                  <FaFire className={`streak-fire-icon ${streakData.current > 0 ? 'active' : 'inactive'}`} />
                </div>
                <div className="streak-details-compact">
                  <span className="streak-label">Current Streak</span>
                  <span className="streak-value">{streakData.current} days</span>
                  <span className="streak-msg">
                    {streakData.current > 0 ? "Great job! Keep it up! 🎉" : "Start today! 💪"}
                  </span>
                </div>
              </div>
              <div className="streak-box">
                <div className="streak-icon-circle best">
                  <FaTrophy className="streak-trophy-icon" />
                </div>
                <div className="streak-details-compact">
                  <span className="streak-label">Best Streak</span>
                  <span className="streak-value">{streakData.highest} days</span>
                  <span className="streak-msg">
                    {streakData.highest > 0 ? "Your personal record! 🏆" : "Ready to start?"}
                  </span>
                </div>
              </div>
            </div>
            {streakData.current > 0 && (
              <div className="streak-motivation-compact">
                {streakData.current === 1 && "🔥 Come back tomorrow!"}
                {streakData.current >= 2 && streakData.current < 7 && `🚀 ${streakData.current} days in a row!`}
                {streakData.current >= 7 && streakData.current < 30 && `⭐ ${streakData.current} days straight!`}
                {streakData.current >= 30 && `🏆 ${streakData.current} days! Unstoppable!`}
              </div>
            )}
          </div>

          {/* Course Progress */}
          <div className="stat-card course-progress-card">
            <div className="card-header">
              <h3>Course Progress</h3>
              <span className="course-count-badge">{purchasedCourses.length} enrolled</span>
            </div>
            {purchasedCourses.length > 0 ? (
              <div className="course-preview-compact">
                {(() => {
                  const course = purchasedCourses[0];
                  const totalVideos = course.weeks?.reduce((acc, week) => 
                    acc + (week.days?.reduce((dayAcc, day) => 
                      dayAcc + (day.contents?.filter(content => content.type === 'video')?.length || 0), 0) || 0), 0
                  ) || 0;
                  
                  const user = getUser();
                  let courseProgressData = null;
                  if (user && user.courseProgress) {
                    courseProgressData = user.courseProgress.find(cp => cp.courseId === course._id);
                  }
                  
                  const completedVideos = courseProgressData?.completedVideos || 0;
                  const courseProgress = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;
                  
                  return (
                    <div className="course-card-compact" onClick={() => navigate(`/mycourse/${course._id}`)}>
                      <div className="course-icon-compact">
                        <MdVideoLibrary className="course-icon-svg-compact" />
                        <div className="progress-badge">{courseProgress}%</div>
                      </div>
                      <div className="course-info-compact">
                        <h4>{course.title}</h4>
                        <div className="course-stats-compact">
                          <span><FaEye /> {completedVideos}/{totalVideos} videos</span>
                        </div>
                        <div className="progress-bar-simple">
                          <div 
                            className="progress-fill-simple"
                            style={{ width: `${courseProgress}%` }}
                          />
                        </div>
                        <button className="view-course-btn">
                          View Course <FaChevronRight />
                        </button>
                      </div>
                    </div>
                  );
                })()}
              </div>
            ) : (
              <div className="no-courses-compact">
                <MdVideoLibrary className="empty-icon" />
                <p>No courses enrolled yet!</p>
              </div>
            )}
          </div>
        </div>

        {/* Milestones & Achievements */}
        <div className="section-card">
          <div className="section-header">
            <h3>Achievements</h3>
            <span className="milestone-count">{milestones.filter(m => m.completed).length}/{milestones.length} unlocked</span>
          </div>
          <div className="milestones-grid">
            {milestones.map((milestone) => (
              <div key={milestone.id} className={`milestone-card ${milestone.completed ? 'completed' : 'locked'}`}>
                <div className="milestone-icon">
                  {milestone.completed ? (
                    <span className="emoji">{milestone.icon}</span>
                  ) : (
                    <span className="locked-icon">🔒</span>
                  )}
                </div>
                <h4>{milestone.title}</h4>
                {milestone.completed && <FaCheck className="check-icon" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </StudentLayout>
  );
};

export default ProgressDashboard;