import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMockResult } from '../../Api/api';
import StudentLayout from './StudentLayout';
import './StudentMockStyles.css';

const MockResult = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetchResult();
  }, [attemptId]);

  const fetchResult = async () => {
    try {
      setLoading(true);
      const response = await getMockResult(attemptId);
      setResult(response.data.attempt);
    } catch (error) {
      console.error('Error fetching result:', error);
      toast.error(error.response?.data?.message || 'Failed to load result');
      navigate('/student/mocks');
    } finally {
      setLoading(false);
    }
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 75) return '#4CAF50';
    if (percentage >= 50) return '#FF9800';
    return '#f44336';
  };

  const getGrade = (percentage) => {
    if (percentage >= 90) return 'A+';
    if (percentage >= 80) return 'A';
    if (percentage >= 70) return 'B+';
    if (percentage >= 60) return 'B';
    if (percentage >= 50) return 'C';
    if (percentage >= 40) return 'D';
    return 'F';
  };

  if (loading) {
    return (
      <StudentLayout>
        <div className="loading-container">
          <h2>Loading Results...</h2>
        </div>
      </StudentLayout>
    );
  }

  if (!result) {
    return null;
  }

  const mock = result.mockId;
  const percentage = parseFloat(result.percentage);

  return (
    <StudentLayout>
      <div className="mock-result-container">
      <div className="result-header">
        <button onClick={() => navigate('/student/mocks')} className="back-btn">
          ← Back to Mocks
        </button>
        <h2>Mock Exam Results</h2>
      </div>

      <div className="result-summary-card">
        <h3>{mock.title}</h3>
        
        <div className="score-display">
          <div className="score-circle" style={{ borderColor: getPercentageColor(percentage) }}>
            <div className="score-value">{result.marksObtained}</div>
            <div className="score-total">out of {result.totalMarks}</div>
          </div>
          
          <div className="score-details">
            <div className="score-item">
              <span className="score-label">Percentage:</span>
              <span 
                className="score-number" 
                style={{ color: getPercentageColor(percentage) }}
              >
                {percentage}%
              </span>
            </div>
            <div className="score-item">
              <span className="score-label">Grade:</span>
              <span 
                className="score-grade"
                style={{ color: getPercentageColor(percentage) }}
              >
                {getGrade(percentage)}
              </span>
            </div>
            <div className="score-item">
              <span className="score-label">Status:</span>
              <span className={`status-badge ${result.status}`}>
                {result.status === 'auto-submitted' ? 'Auto Submitted' : 'Submitted'}
              </span>
            </div>
          </div>
        </div>

        <div className="attempt-info">
          <div className="info-row">
            <span className="info-label">Started At:</span>
            <span className="info-value">{new Date(result.startTime).toLocaleString()}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Submitted At:</span>
            <span className="info-value">{new Date(result.endTime).toLocaleString()}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Fullscreen Exits:</span>
            <span className="info-value">{result.exitFullscreenCount}</span>
          </div>
        </div>
      </div>

      {/* Questions Review */}
      <div className="questions-review-section">
        <h3>Questions & Answers</h3>
        
        {mock.questions.map((question, index) => {
          const answer = result.answers.find(a => a.questionId.toString() === question._id.toString());
          const isCorrect = answer?.isCorrect;
          
          return (
            <div key={question._id} className={`review-question-card ${isCorrect ? 'correct' : 'incorrect'}`}>
              <div className="review-question-header">
                <div className="question-number-badge">
                  Question {index + 1}
                </div>
                <div className="marks-badge">
                  {answer?.marksAwarded || 0} / {question.marks} marks
                </div>
                <div className={`result-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
                  {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </div>
              </div>

              <div className="review-question-text">
                <h4>{question.questionText}</h4>
              </div>

              {question.questionType === 'mcq' && (
                <div className="review-options">
                  {question.options.map((option, optIndex) => (
                    <div 
                      key={optIndex}
                      className={`review-option ${
                        option === question.correctAnswer ? 'correct-option' : ''
                      } ${
                        option === answer?.answer && option !== question.correctAnswer ? 'wrong-option' : ''
                      } ${
                        option === answer?.answer ? 'selected' : ''
                      }`}
                    >
                      <span className="option-letter">{String.fromCharCode(65 + optIndex)}.</span>
                      <span className="option-text">{option}</span>
                      {option === question.correctAnswer && <span className="correct-indicator">✓ Correct Answer</span>}
                      {option === answer?.answer && option !== question.correctAnswer && <span className="wrong-indicator">✗ Your Answer</span>}
                    </div>
                  ))}
                </div>
              )}

              {(question.questionType === 'text' || question.questionType === 'oneWord') && (
                <div className="review-answers">
                  <div className="answer-item">
                    <span className="answer-label">Your Answer:</span>
                    <span className={`answer-value ${isCorrect ? 'correct' : 'incorrect'}`}>
                      {answer?.answer || 'Not Answered'}
                    </span>
                  </div>
                  <div className="answer-item">
                    <span className="answer-label">Correct Answer:</span>
                    <span className="answer-value correct">
                      {question.correctAnswer}
                    </span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Performance Analysis */}
      <div className="performance-analysis">
        <h3>Performance Analysis</h3>
        <div className="analysis-grid">
          <div className="analysis-card">
            <div className="analysis-icon correct">✓</div>
            <div className="analysis-data">
              <div className="analysis-value">
                {result.answers.filter(a => a.isCorrect).length}
              </div>
              <div className="analysis-label">Correct Answers</div>
            </div>
          </div>
          <div className="analysis-card">
            <div className="analysis-icon incorrect">✗</div>
            <div className="analysis-data">
              <div className="analysis-value">
                {result.answers.filter(a => !a.isCorrect).length}
              </div>
              <div className="analysis-label">Incorrect Answers</div>
            </div>
          </div>
          <div className="analysis-card">
            <div className="analysis-icon total">📊</div>
            <div className="analysis-data">
              <div className="analysis-value">
                {mock.questions.length}
              </div>
              <div className="analysis-label">Total Questions</div>
            </div>
          </div>
          <div className="analysis-card">
            <div className="analysis-icon accuracy">🎯</div>
            <div className="analysis-data">
              <div className="analysis-value">
                {((result.answers.filter(a => a.isCorrect).length / mock.questions.length) * 100).toFixed(1)}%
              </div>
              <div className="analysis-label">Accuracy</div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </StudentLayout>
  );
};

export default MockResult;
