import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getMockById } from '../../Api/api';
import { getAuthToken } from '../../utils/auth';
import AdminLayout from './AdminLayout';
import './MockStyles.css';

const PreviewMock = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [mock, setMock] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [expandedScenario, setExpandedScenario] = useState(null);

  useEffect(() => {
    fetchMock();
  }, [id]);

  const fetchMock = async () => {
    try {
      setLoading(true);
      const response = await getMockById(id);
      setMock(response.data.mock);
    } catch (error) {
      console.error('Error fetching mock:', error);
      toast.error('Failed to load mock');
      navigate('/admin/manage-mocks');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get all questions
  const getAllQuestions = () => {
    if (!mock) return [];
    if (mock.scenarios && mock.scenarios.length > 0) {
      return mock.scenarios.flatMap(s => s.questions.map(q => ({ ...q, scenarioId: s._id })));
    }
    return mock.questions || [];
  };

  // Helper function to get question by index
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

  const goToQuestion = (index) => {
    setCurrentQuestion(index);
  };

  const nextQuestion = () => {
    const totalQuestions = getAllQuestions().length;
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const prevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="preview-loading">
          <h2>Loading Mock Preview...</h2>
        </div>
      </AdminLayout>
    );
  }

  if (!mock) {
    return null;
  }

  const allQuestions = getAllQuestions();
  const totalQuestions = allQuestions.length;
  const { question, scenario } = getQuestionByIndex(currentQuestion);

  if (!question) {
    return (
      <AdminLayout>
        <div className="preview-error">
          <p>No questions found in this mock</p>
          <button onClick={() => navigate('/admin/manage-mocks')} className="back-btn">
            ← Back to Mocks
          </button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="mock-preview-container">
        {/* Header */}
        <div className="mock-preview-header">
          <div className="preview-title-section">
            <h2>📋 Mock Preview: {mock.title}</h2>
            <p className="preview-subtitle">
              {totalQuestions} Questions • {mock.totalMarks} Marks • {mock.duration} Minutes
            </p>
            <span className={`status-badge ${mock.status}`}>{mock.status.toUpperCase()}</span>
          </div>
          <button onClick={() => navigate('/admin/manage-mocks')} className="back-btn">
            ← Back to Mocks
          </button>
        </div>

        <div className="mock-preview-body">
          {/* Question Navigator */}
          <div className="question-navigator preview-navigator">
            <h3>Questions</h3>
            <div className="question-grid">
              {allQuestions.map((q, index) => (
                <button
                  key={q._id || index}
                  className={`question-nav-btn ${currentQuestion === index ? 'active' : ''}`}
                  onClick={() => goToQuestion(index)}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Question Content */}
          <div className="question-content preview-content">
            {/* Scenario Information */}
            {scenario && (
              <div className="scenario-section preview-scenario">
                <h3 className="scenario-title">{scenario.title}</h3>
                <div className="scenario-description">
                  <p>{scenario.description}</p>
                </div>
                {scenario.images && scenario.images.length > 0 && (
                  <div className="scenario-images">
                    {scenario.images.map((img, index) => {
                      const token = getAuthToken();
                      console.log('Scenario Image S3 Key:', img);
                      const imageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:7001/api'}/stream/${img}${token ? `?token=${token}` : ''}`;
                      console.log('Scenario Image URL:', imageUrl);
                      return (
                        <img 
                          key={index}
                          src={imageUrl}
                          alt={`Scenario ${index + 1}`}
                          className="scenario-image"
                          onError={(e) => {
                            console.error('Failed to load scenario image:', img, 'URL:', imageUrl);
                            e.target.style.display = 'none';
                          }}
                          onLoad={() => {
                            console.log('Successfully loaded scenario image:', img);
                          }}
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

            {/* Question Images */}
            {question.images && question.images.length > 0 && (
              <div className="question-images">
                {question.images.map((img, index) => {
                  const token = getAuthToken();
                  console.log('Question Image S3 Key:', img);
                  const imageUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:7001/api'}/stream/${img}${token ? `?token=${token}` : ''}`;
                  console.log('Question Image URL:', imageUrl);
                  return (
                    <img 
                      key={index}
                      src={imageUrl}
                      alt={`Question Image ${index + 1}`}
                      className="question-image"
                      onError={(e) => {
                        console.error('Failed to load question image:', img, 'URL:', imageUrl);
                        e.target.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log('Successfully loaded question image:', img);
                      }}
                    />
                  );
                })}
              </div>
            )}

            <div className="answer-section preview-answer">
              <div className="preview-note">
                <strong>Preview Mode:</strong> This is how students will see the question.
              </div>
              {question.questionType === 'mcq' ? (
                <div className="mcq-options">
                  {question.options.map((option, index) => (
                    <label key={index} className="option-label preview-option">
                      <input
                        type="radio"
                        name={`question-${question._id}`}
                        disabled
                      />
                      <span className="option-text">{option}</span>
                      {option === question.correctAnswer && (
                        <span className="correct-indicator" title="Correct Answer">✓</span>
                      )}
                    </label>
                  ))}
                </div>
              ) : question.questionType === 'oneWord' ? (
                <div>
                  <input
                    type="text"
                    className="answer-input one-word"
                    placeholder="Enter your answer (one word)"
                    disabled
                  />
                  <div className="correct-answer-display">
                    <strong>Correct Answer:</strong> {question.correctAnswer}
                  </div>
                </div>
              ) : (
                <div>
                  <textarea
                    className="answer-input text-answer"
                    placeholder="Type your answer here..."
                    disabled
                    rows="5"
                  />
                  <div className="correct-answer-display">
                    <strong>Correct Answer:</strong> {question.correctAnswer}
                  </div>
                </div>
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
              
              <button 
                onClick={nextQuestion}
                disabled={currentQuestion === totalQuestions - 1}
                className="nav-btn next-btn"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        {/* Mock Summary Section */}
        <div className="mock-summary-section">
          <h3>Mock Summary</h3>
          <div className="summary-stats">
            <div className="stat-item">
              <span className="stat-label">Total Questions:</span>
              <span className="stat-value">{totalQuestions}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Marks:</span>
              <span className="stat-value">{mock.totalMarks}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Duration:</span>
              <span className="stat-value">{mock.duration} minutes</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Scenarios:</span>
              <span className="stat-value">{mock.scenarios?.length || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default PreviewMock;
