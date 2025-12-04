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
          <div className="info-banner">
            <div className="info-banner-icon">💡</div>
            <div className="info-banner-content">
              <h3>Get ALL Mocks FREE with Any Course!</h3>
              <p>Purchase any course and unlock instant access to all mock exams at no additional cost.</p>
            </div>
            <button className="view-courses-btn" onClick={() => navigate('/courses')}>
              View Courses
            </button>
          </div>
        </div>

        {/* Mocks Grid */}
        <div className="container mocks-content">
          {loading ? (
            <div className="loading-container">
              <div className="spinner"></div>
              <p>Loading mock exams...</p>
            </div>
          ) : mocks.length === 0 ? (
            <div className="no-mocks-container">
              <div className="no-mocks-icon">📝</div>
              <h3>No Mock Exams Available</h3>
              <p>Check back soon for new mock exams!</p>
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
