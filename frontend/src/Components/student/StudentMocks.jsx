import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getLiveMocks, getPastMocks, getMissedMocks, createMockCheckoutSession } from '../../Api/api';
import StudentLayout from './StudentLayout';
import './StudentMockStyles.css';

const StudentMocks = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('live');
  const [liveMocks, setLiveMocks] = useState([]);
  const [pastMocks, setPastMocks] = useState([]);
  const [missedMocks, setMissedMocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    fetchMocks();
  }, [activeTab]);

  const fetchMocks = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'live') {
        const response = await getLiveMocks();
        setLiveMocks(response.data.mocks);
      } else if (activeTab === 'past') {
        const response = await getPastMocks();
        setPastMocks(response.data.attempts);
      } else if (activeTab === 'missed') {
        const response = await getMissedMocks();
        setMissedMocks(response.data.mocks);
      }
    } catch (error) {
      console.error('Error fetching mocks:', error);
      toast.error('Failed to load mocks');
    } finally {
      setLoading(false);
    }
  };

  const startMock = (mockId) => {
    navigate(`/student/mock-attempt/${mockId}`);
  };

  const viewResult = (attemptId) => {
    navigate(`/student/mock-result/${attemptId}`);
  };

  const handlePurchaseMock = async (mockId) => {
    try {
      setPurchasing(mockId);
      
      const successUrl = `${window.location.origin}/student/mocks?payment=success`;
      const cancelUrl = `${window.location.origin}/student/mocks?payment=cancelled`;

      const response = await createMockCheckoutSession({
        mockId,
        successUrl,
        cancelUrl,
      });

      // Redirect to Stripe checkout
      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast.error('Failed to initiate purchase. Please try again.');
    } finally {
      setPurchasing(null);
    }
  };

  const renderLiveMocks = () => {
    if (liveMocks.length === 0) {
      return (
        <div className="no-mocks-message">
          <p>No live mocks available at the moment</p>
        </div>
      );
    }

    return (
      <div className="mocks-list">
        {liveMocks.map((mock) => (
          <div key={mock._id} className="student-mock-card">
            <div className="mock-card-header">
              <h3>{mock.title}</h3>
              <span className="mock-badge live">LIVE</span>
            </div>
            
            <p className="mock-description">{mock.description || 'No description'}</p>
            
            <div className="mock-details">
              <div className="detail-item">
                <span className="detail-icon">📝</span>
                <span>{mock.questions.length} Questions</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">⭐</span>
                <span>{mock.totalMarks} Marks</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">⏱️</span>
                <span>{mock.duration} Minutes</span>
              </div>
              {mock.isPaid && (
                <div className="detail-item">
                  <span className="detail-icon">💰</span>
                  <span>
                    ${mock.price}
                    {mock.cutPrice > 0 && (
                      <span style={{ textDecoration: 'line-through', marginLeft: '8px', color: '#999' }}>
                        ${mock.cutPrice}
                      </span>
                    )}
                  </span>
                </div>
              )}
            </div>

            {mock.isLocked ? (
              <div className="locked-message">
                <span>🔒 Purchase Required</span>
                <p style={{ fontSize: '14px', color: '#666', margin: '10px 0' }}>
                  Purchase any course to get free access to all mocks, or buy this mock individually.
                </p>
                <button 
                  className="purchase-btn"
                  onClick={() => handlePurchaseMock(mock._id)}
                  disabled={purchasing === mock._id}
                >
                  {purchasing === mock._id ? 'Processing...' : `Purchase Mock - $${mock.price}`}
                </button>
              </div>
            ) : mock.hasAttempted ? (
              <div className="attempted-message">
                <span>✓ Already Attempted</span>
                <button 
                  className="view-result-btn"
                  onClick={() => viewResult(mock.attemptId)}
                  disabled={mock.status === 'live'}
                >
                  {mock.status === 'live' ? 'View Result (After Mock Ends)' : 'View Result'}
                </button>
              </div>
            ) : (
              <button 
                className="start-mock-btn"
                onClick={() => startMock(mock._id)}
              >
                Start Mock Exam
              </button>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderPastMocks = () => {
    if (pastMocks.length === 0) {
      return (
        <div className="no-mocks-message">
          <p>You haven't attempted any mocks yet</p>
        </div>
      );
    }

    return (
      <div className="mocks-list">
        {pastMocks.map((attempt) => (
          <div key={attempt._id} className="student-mock-card past">
            <div className="mock-card-header">
              <h3>{attempt.mockId?.title || 'Mock Exam'}</h3>
              <span className="mock-badge ended">ENDED</span>
            </div>
            
            <div className="result-summary">
              <div className="result-item">
                <span className="result-label">Marks Obtained:</span>
                <span className="result-value">{attempt.marksObtained}/{attempt.totalMarks}</span>
              </div>
              <div className="result-item">
                <span className="result-label">Percentage:</span>
                <span className="result-value percentage">{attempt.percentage}%</span>
              </div>
              <div className="result-item">
                <span className="result-label">Status:</span>
                <span className={`status-badge ${attempt.status}`}>
                  {attempt.status === 'auto-submitted' ? 'Auto Submitted' : 'Submitted'}
                </span>
              </div>
            </div>

            <div className="mock-timestamp">
              Attempted on: {new Date(attempt.createdAt).toLocaleString()}
            </div>

            <button 
              className="view-result-btn"
              onClick={() => viewResult(attempt._id)}
            >
              View Detailed Results
            </button>
          </div>
        ))}
      </div>
    );
  };

  const renderMissedMocks = () => {
    if (missedMocks.length === 0) {
      return (
        <div className="no-mocks-message">
          <p>You haven't missed any mocks</p>
        </div>
      );
    }

    return (
      <div className="mocks-list">
        {missedMocks.map((mock) => (
          <div key={mock._id} className="student-mock-card missed">
            <div className="mock-card-header">
              <h3>{mock.title}</h3>
              <span className="mock-badge missed">MISSED</span>
            </div>
            
            <p className="mock-description">{mock.description || 'No description'}</p>
            
            <div className="mock-details">
              <div className="detail-item">
                <span className="detail-icon">📝</span>
                <span>{mock.questions.length} Questions</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">⭐</span>
                <span>{mock.totalMarks} Marks</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">⏱️</span>
                <span>{mock.duration} Minutes</span>
              </div>
            </div>

            <div className="mock-timestamp">
              Ended on: {new Date(mock.endAt).toLocaleString()}
            </div>

            <div className="missed-message">
              You missed this mock exam
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <StudentLayout>
      <div className="student-mocks-container">
        <div className="student-mocks-header">
          <h2>Mock Exams</h2>
        </div>

        <div className="info-banner" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '15px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '24px' }}>💡</span>
          <div>
            <strong>Pro Tip:</strong> Purchase any course to get FREE access to ALL mock exams! 
            Or purchase individual mocks separately.
          </div>
        </div>

      <div className="mocks-tabs">
        <button 
          className={`tab-btn ${activeTab === 'live' ? 'active' : ''}`}
          onClick={() => setActiveTab('live')}
        >
          Live Mocks
        </button>
        <button 
          className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past Mocks
        </button>
        <button 
          className={`tab-btn ${activeTab === 'missed' ? 'active' : ''}`}
          onClick={() => setActiveTab('missed')}
        >
          Missed Mocks
        </button>
      </div>

      <div className="mocks-content">
        {loading ? (
          <div className="loading-message">Loading mocks...</div>
        ) : (
          <>
            {activeTab === 'live' && renderLiveMocks()}
            {activeTab === 'past' && renderPastMocks()}
            {activeTab === 'missed' && renderMissedMocks()}
          </>
        )}
      </div>
      </div>
    </StudentLayout>
  );
};

export default StudentMocks;
