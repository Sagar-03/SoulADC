import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api, createMockCheckoutSession } from '../../Api/api';
import { isAuthenticated } from '../../utils/auth';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/footer';
import './MocksPage.css';

const MocksPage = () => {
  const navigate = useNavigate();
  const [mocks, setMocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(null);

  useEffect(() => {
    fetchMocks();
  }, []);

  const fetchMocks = async () => {
    try {
      setLoading(true);
      // Use public endpoint that doesn't require authentication
      const response = await api.get('/mocks/public');
      setMocks(response.data.mocks || []);
    } catch (error) {
      console.error('Error fetching mocks:', error);
      toast.error('Failed to load mocks');
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (mockId, mockTitle, price) => {
    if (!isAuthenticated()) {
      toast.info('Please login to purchase mocks');
      navigate('/login');
      return;
    }

    // Navigate to payment page with mock details
    navigate(`/payment/mock?mockId=${mockId}&title=${encodeURIComponent(mockTitle)}&price=${price}`);
  };

  return (
    <>
      <Navbar />
      <div className="mocks-page-container">
        {/* Banner */}
        <div className="page-banner">
          <h1>Mock Exams</h1>
          <p>Test your knowledge with comprehensive mock exams</p>
        </div>

        {/* Info Banner */}
        <div className="container info-banner-container">
          {/* <div className="info-banner">
            <div className="info-banner-icon">💡</div>
            <div className="info-banner-content">
              <h3>Get ALL Mocks FREE with Any Course!</h3>
              <p>Purchase any course and unlock instant access to all mock exams at no additional cost.</p>
            </div>
            <button className="view-courses-btn" onClick={() => navigate('/courses')}>
              View Courses
            </button>
          </div> */}
        </div>

        {/* Mocks Grid */}
        <div className="container mocks-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading mock exams...</p>
            </div>
          ) : mocks.length === 0 ? (
            <div className="no-mocks-wrapper">
              {/* CTA Banner */}
              <div className="unlock-banner">
                <div className="unlock-banner-left">
                  <div className="unlock-icon">🎓</div>
                  <div>
                    <h3>Unlock All Mock Exams</h3>
                    <p>Purchase any course to get instant free access to all mock exams, or buy individually.</p>
                  </div>
                </div>
                <button className="purchase-course-btn" onClick={() => navigate('/courses')}>
                  Purchase a Course
                </button>
              </div>

              {/* Locked Preview Cards */}
              <div className="locked-mocks-grid">
                {[
                  { title: 'Full Mock Exam – Set 1', questions: 65, duration: '3.0 hours', price: 'AUD 49' },
                  { title: 'Full Mock Exam – Set 2', questions: 65, duration: '3.0 hours', price: 'AUD 49' },
                  { title: 'Full Mock Exam – Set 3', questions: 65, duration: '3.0 hours', price: 'AUD 49' },
                ].map((item, i) => (
                  <div key={i} className="locked-mock-card">
                    <div className="locked-overlay">
                      <div className="lock-icon-circle">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                          <rect x="3" y="11" width="18" height="11" rx="2" fill="#A98C6A"/>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke="#A98C6A" strokeWidth="2" strokeLinecap="round"/>
                          <circle cx="12" cy="16" r="1.5" fill="white"/>
                        </svg>
                      </div>
                      <p className="locked-label">Locked</p>
                      <button className="locked-enroll-btn" onClick={() => navigate('/courses')}>
                        Purchase to Unlock
                      </button>
                    </div>
                    <div className="locked-card-content">
                      <h3 className="locked-mock-title">{item.title}</h3>
                      <p className="locked-mock-desc">Comprehensive mock exam to test your knowledge and exam readiness.</p>
                      <div className="locked-info-grid">
                        <div className="locked-info-item">
                          <span className="locked-info-label">Questions</span>
                          <span className="locked-info-value">{item.questions}</span>
                        </div>
                        <div className="locked-info-item">
                          <span className="locked-info-label">Duration</span>
                          <span className="locked-info-value">{item.duration}</span>
                        </div>
                        <div className="locked-info-item">
                          <span className="locked-info-label">Fee*</span>
                          <span className="locked-info-value">{item.price}</span>
                        </div>
                        <div className="locked-info-item">
                          <span className="locked-info-label">Location</span>
                          <span className="locked-info-value">Online</span>
                        </div>
                      </div>
                    </div>
                    <div className="locked-card-footer">
                      <button className="locked-contact-btn">Contact Us</button>
                      <button className="locked-enroll-footer-btn" onClick={() => navigate('/courses')}>
                        🔒 Enroll
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <p className="coming-soon-note">* More mock exams coming soon. Purchase a course to access all available mocks for free.</p>
            </div>
          ) : (
            <div className="mocks-grid">
              {mocks.map((mock) => (
                <div key={mock._id} className="mock-card">
                  <div className="mock-card-content">
                    {/* Title and Description */}
                    <div className="mock-header">
                      <h3 className="mock-title">{mock.title}</h3>
                      <p className="mock-description">
                        {mock.description || 'Comprehensive mock exam to test your knowledge'}
                      </p>
                    </div>

                    {/* Info Grid - 2 Columns */}
                    <div className="mock-info-grid">
                      <div className="info-item">
                        <span className="info-label">Fee*</span>
                        <div className="info-value-group">
                          {mock.cutPrice > 0 && (
                            <span className="price-old">AUD {mock.cutPrice}</span>
                          )}
                          <span className="price-current">AUD {mock.price}</span>
                        </div>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-label">Duration</span>
                        <span className="info-value">{(mock.duration / 60).toFixed(1)} hours</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-label">Questions</span>
                        <span className="info-value">{mock.questions?.length || 0}</span>
                      </div>
                      
                      <div className="info-item">
                        <span className="info-label">Location</span>
                        <span className="info-value">Online</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="mock-card-footer">
                    <button className="contact-btn">Contact Us</button>
                    <button
                      className="enroll-btn"
                      onClick={() => handleEnroll(mock._id, mock.title, mock.price)}
                      disabled={purchasing === mock._id}
                    >
                      {purchasing === mock._id ? 'Processing...' : 'Enroll'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MocksPage;
