import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { startMockAttempt, submitMockAttempt, updateFullscreenExit } from '../../Api/api';
import { getAuthToken } from '../../utils/auth';
import './StudentMockStyles.css';

const MockAttempt = () => {
  const { mockId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [mock, setMock] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [exitCount, setExitCount] = useState(0);
  const timerRef = useRef(null);
  const warningTimeoutRef = useRef(null);

  useEffect(() => {
    initializeMock();
    enterFullscreen();
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      exitFullscreen();
    };
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && attempt) {
        handleFullscreenExit();
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [attempt]);

  const initializeMock = async () => {
    try {
      setLoading(true);
      const response = await startMockAttempt(mockId);
      setMock(response.data.mock);
      setAttempt(response.data.attempt);
      setTimeRemaining(response.data.mock.duration * 60); // Convert to seconds
      
      // Initialize empty answers - support both scenario-based and legacy questions
      const initialAnswers = {};
      
      if (response.data.mock.scenarios && response.data.mock.scenarios.length > 0) {
        // New scenario-based structure
        response.data.mock.scenarios.forEach((scenario) => {
          scenario.questions.forEach(q => {
            initialAnswers[q._id] = '';
          });
        });
      } else if (response.data.mock.questions && response.data.mock.questions.length > 0) {
        // Legacy question structure
        response.data.mock.questions.forEach(q => {
          initialAnswers[q._id] = '';
        });
      }
      
      setAnswers(initialAnswers);

      // Start timer
      startTimer();
    } catch (error) {
      console.error('Error starting mock:', error);
      const errorMessage = error.response?.data?.message || 'Failed to start mock';
      
      // If already attempted, show message and redirect
      if (errorMessage.includes('already attempted')) {
        toast.info('You have already attempted this mock. Redirecting to results...');
      } else {
        toast.error(errorMessage);
      }
      
      navigate('/student/mocks');
    } finally {
      setLoading(false);
    }
  };

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const enterFullscreen = async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if (elem.webkitRequestFullscreen) {
        await elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        await elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        await elem.msRequestFullscreen();
      }
    } catch (error) {
      console.error('Error entering fullscreen:', error);
    }
  };

  const exitFullscreen = () => {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      } else if (document.msExitFullscreen) {
        document.msExitFullscreen();
      }
    } catch (error) {
      console.error('Error exiting fullscreen:', error);
    }
  };

  const handleFullscreenExit = async () => {
    setShowFullscreenWarning(true);
    setExitCount(prev => prev + 1);

    // Update exit count in backend
    try {
      await updateFullscreenExit(attempt._id);
    } catch (error) {
      console.error('Error updating fullscreen exit:', error);
    }

    // Show persistent warning
    toast.error('⚠️ Please return to fullscreen mode!', {
      position: 'top-center',
      autoClose: false,
      closeOnClick: false,
    });

    // Auto re-enter fullscreen after 3 seconds
    warningTimeoutRef.current = setTimeout(() => {
      enterFullscreen();
    }, 3000);
  };

  const dismissWarning = () => {
    setShowFullscreenWarning(false);
    enterFullscreen();
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current);
    }
  };

  const handleAnswerChange = (questionId, value) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async () => {
    if (window.confirm('Are you sure you want to submit? You cannot change answers after submission.')) {
      await submitMock();
    }
  };

  const handleAutoSubmit = async () => {
    toast.info('Time is up! Auto-submitting your answers...');
    await submitMock();
  };

  const submitMock = async () => {
    try {
      setSubmitting(true);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      const formattedAnswers = Object.keys(answers).map(questionId => ({
        questionId,
        answer: answers[questionId],
      }));

      await submitMockAttempt(attempt._id, { answers: formattedAnswers });
      
      exitFullscreen();
      toast.success('Mock submitted successfully!');
      navigate('/student/mocks');
    } catch (error) {
      console.error('Error submitting mock:', error);
      toast.error('Failed to submit mock');
      setSubmitting(false);
    }
  };

  const goToQuestion = (index) => {
    setCurrentQuestion(index);
  };

  // Memoize computed values to prevent re-renders
  const totalQuestions = useMemo(() => {
    if (!mock) return 0;
    if (mock.scenarios && mock.scenarios.length > 0) {
      return mock.scenarios.reduce((sum, scenario) => sum + scenario.questions.length, 0);
    }
    return mock.questions?.length || 0;
  }, [mock]);

  const allQuestions = useMemo(() => {
    if (!mock) return [];
    if (mock.scenarios && mock.scenarios.length > 0) {
      const questions = [];
      mock.scenarios.forEach(scenario => {
        scenario.questions.forEach(q => questions.push({ ...q, scenarioId: scenario._id }));
      });
      return questions;
    }
    return mock.questions || [];
  }, [mock]);

  const nextQuestion = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  // Helper function to get question by index (works with scenarios or legacy)
  const getQuestionByIndex = (index) => {
    if (!mock) return { question: null, scenario: null };
    if (mock.scenarios && mock.scenarios.length > 0) {
      let count = 0;
      for (const scenario of mock.scenarios) {
        if (index < count + scenario.questions.length) {
          return {
            question: scenario.questions[index - count],
            scenario: scenario
          };
        }
        count += scenario.questions.length;
      }
    }
    return {
      question: mock.questions?.[index],
      scenario: null
    };
  };

  if (loading) {
    return (
      <div className="mock-attempt-loading">
        <h2>Starting Mock Exam...</h2>
        <p>Please wait while we prepare your exam</p>
      </div>
    );
  }

  if (!mock || !attempt) {
    return null;
  }

  const { question, scenario } = getQuestionByIndex(currentQuestion);
  
  if (!question) {
    return <div>Error loading question</div>;
  }
  
  const isAnswered = answers[question._id]?.trim() !== '';

  return (
    <div className="mock-attempt-container">
      {/* Fullscreen Warning */}
      {showFullscreenWarning && (
        <div className="fullscreen-warning-overlay">
          <div className="fullscreen-warning-modal">
            <h2>⚠️ Warning!</h2>
            <p>You have exited fullscreen mode</p>
            <p className="warning-count">Exit Count: {exitCount}</p>
            <p>Please return to fullscreen to continue the exam</p>
            <button onClick={dismissWarning} className="return-fullscreen-btn">
              Return to Fullscreen
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mock-attempt-header">
        <div className="mock-info">
          <h2>{mock.title}</h2>
          <p>{totalQuestions} Questions • {mock.totalMarks} Marks</p>
        </div>
        <div className="timer-section">
          <div className={`timer ${timeRemaining < 300 ? 'warning' : ''}`}>
            <span className="timer-icon">⏱️</span>
            <span className="timer-value">{formatTime(timeRemaining)}</span>
          </div>
        </div>
      </div>

      <div className="mock-attempt-body">
        {/* Question Navigator */}
        <div className="question-navigator">
          <h3>Questions</h3>
          <div className="question-grid">
            {allQuestions.map((q, index) => (
              <button
                key={q._id}
                className={`question-nav-btn ${currentQuestion === index ? 'active' : ''} ${
                  answers[q._id]?.trim() !== '' ? 'answered' : ''
                }`}
                onClick={() => goToQuestion(index)}
              >
                {index + 1}
              </button>
            ))}
          </div>
          <div className="nav-legend">
            <div className="legend-item">
              <span className="legend-box answered"></span>
              <span>Answered</span>
            </div>
            <div className="legend-item">
              <span className="legend-box unanswered"></span>
              <span>Unanswered</span>
            </div>
          </div>
        </div>

        {/* Question Content */}
        <div className="question-content">
          {/* Scenario Information */}
          {scenario && (
            <div className="scenario-section">
              <h3 className="scenario-title">{scenario.title}</h3>
              <div className="scenario-description">
                <p>{scenario.description}</p>
              </div>
              {scenario.images && scenario.images.length > 0 && (
                <div className="scenario-images">
                  {scenario.images.map((img, index) => {
                    const token = getAuthToken();
                    // Properly encode the image path
                    const encodedImg = encodeURIComponent(img);
                    const imageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:7001/api'}/stream/${encodedImg}${token ? `?token=${token}` : ''}`;
                    return (
                      <img 
                        key={index}
                        src={imageUrl}
                        alt={`Scenario ${index + 1}`}
                        className="scenario-image"
                      />
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="question-header-info">
            <span className="question-number">Question {currentQuestion + 1} of {totalQuestions}</span>
            <span className="question-marks">{question.marks} Marks</span>
          </div>

          <div className="question-text">
            <h3>{question.questionText}</h3>
          </div>

          <div className="answer-section">
            {question.questionType === 'mcq' ? (
              <div className="mcq-options">
                {question.options.map((option, index) => (
                  <label key={index} className="option-label">
                    <input
                      type="radio"
                      name={`question-${question._id}`}
                      value={option}
                      checked={answers[question._id] === option}
                      onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                    />
                    <span className="option-text">{option}</span>
                  </label>
                ))}
              </div>
            ) : question.questionType === 'oneWord' ? (
              <input
                type="text"
                className="answer-input one-word"
                placeholder="Enter your answer (one word)"
                value={answers[question._id] || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                maxLength="50"
              />
            ) : (
              <textarea
                className="answer-input text-answer"
                placeholder="Type your answer here..."
                value={answers[question._id] || ''}
                onChange={(e) => handleAnswerChange(question._id, e.target.value)}
                rows="5"
              />
            )}
          </div>

          <div className="question-navigation">
            <button 
              onClick={prevQuestion} 
              disabled={currentQuestion === 0}
              className="nav-btn prev-btn"
            >
              ← Previous
            </button>
            
            {currentQuestion === totalQuestions - 1 ? (
              <button 
                onClick={handleSubmit} 
                disabled={submitting}
                className="submit-mock-btn"
              >
                {submitting ? 'Submitting...' : 'Submit Mock'}
              </button>
            ) : (
              <button 
                onClick={nextQuestion}
                className="nav-btn next-btn"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="progress-section">
        <div className="progress-info">
          <span>Answered: {Object.values(answers).filter(a => a.trim() !== '').length}/{totalQuestions}</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ 
              width: `${(Object.values(answers).filter(a => a.trim() !== '').length / totalQuestions) * 100}%` 
            }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default MockAttempt;
