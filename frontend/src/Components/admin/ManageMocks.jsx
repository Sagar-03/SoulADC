import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { getAllMocks, deleteMock, makeMockLive, endMock, getMockStatistics } from '../../Api/api';
import AdminLayout from './AdminLayout';
import './MockStyles.css';

const ManageMocks = () => {
  const navigate = useNavigate();
  const [mocks, setMocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMock, setSelectedMock] = useState(null);
  const [showStatistics, setShowStatistics] = useState(false);
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchMocks();
  }, []);

  const fetchMocks = async () => {
    try {
      setLoading(true);
      const response = await getAllMocks();
      setMocks(response.data.mocks);
    } catch (error) {
      console.error('Error fetching mocks:', error);
      toast.error('Failed to load mocks');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (mockId) => {
    if (window.confirm('Are you sure you want to delete this mock? This action cannot be undone.')) {
      try {
        await deleteMock(mockId);
        toast.success('Mock deleted successfully');
        fetchMocks();
      } catch (error) {
        console.error('Error deleting mock:', error);
        toast.error('Failed to delete mock');
      }
    }
  };

  const handleMakeLive = async (mockId) => {
    if (window.confirm('Make this mock live? Students will be able to attempt it.')) {
      try {
        await makeMockLive(mockId);
        toast.success('Mock is now live');
        fetchMocks();
      } catch (error) {
        console.error('Error making mock live:', error);
        toast.error('Failed to make mock live');
      }
    }
  };

  const handleEndMock = async (mockId) => {
    if (window.confirm('End this mock? Students will no longer be able to attempt it.')) {
      try {
        await endMock(mockId);
        toast.success('Mock has ended');
        fetchMocks();
      } catch (error) {
        console.error('Error ending mock:', error);
        toast.error('Failed to end mock');
      }
    }
  };

  const viewStatistics = async (mockId) => {
    try {
      const response = await getMockStatistics(mockId);
      setStatistics(response.data);
      setSelectedMock(mockId);
      setShowStatistics(true);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error('Failed to load statistics');
    }
  };

  const closeStatistics = () => {
    setShowStatistics(false);
    setStatistics(null);
    setSelectedMock(null);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'live':
        return '#4CAF50';
      case 'ended':
        return '#f44336';
      default:
        return '#FF9800';
    }
  };

  if (loading) {
    return <div className="loading-container">Loading mocks...</div>;
  }

  return (
    <AdminLayout>
      <div className="manage-mocks-container">
        <div className="manage-mocks-header">
          <h2>Manage Mock Exams</h2>
          <button onClick={() => navigate('/admin/create-mock')} className="create-btn">
            + Create New Mock
          </button>
        </div>

      {mocks.length === 0 ? (
        <div className="no-mocks">
          <p>No mocks available. Create your first mock exam!</p>
        </div>
      ) : (
        <div className="mocks-grid">
          {mocks.map((mock) => (
            <div key={mock._id} className="mock-card">
              <div className="mock-card-header">
                <h3>{mock.title}</h3>
                <span 
                  className="mock-status" 
                  style={{ backgroundColor: getStatusColor(mock.status) }}
                >
                  {mock.status.toUpperCase()}
                </span>
              </div>

              <div className="mock-card-body">
                <p className="mock-description">{mock.description || 'No description'}</p>
                
                <div className="mock-info">
                  <div className="info-item">
                    <span className="info-label">Questions:</span>
                    <span className="info-value">{mock.questions.length}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Total Marks:</span>
                    <span className="info-value">{mock.totalMarks}</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Duration:</span>
                    <span className="info-value">{mock.duration} min</span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Type:</span>
                    <span className="info-value" style={{ color: mock.isPaid ? '#4CAF50' : '#2196F3' }}>
                      {mock.isPaid ? `Paid ($${mock.price})` : 'Free'}
                    </span>
                  </div>
                  {mock.isPaid && mock.cutPrice > 0 && (
                    <div className="info-item">
                      <span className="info-label">Original:</span>
                      <span className="info-value" style={{ textDecoration: 'line-through', color: '#999' }}>
                        ${mock.cutPrice}
                      </span>
                    </div>
                  )}
                </div>

                {mock.liveAt && (
                  <div className="mock-timestamp">
                    Live at: {new Date(mock.liveAt).toLocaleString()}
                  </div>
                )}

                {mock.endAt && (
                  <div className="mock-timestamp">
                    Ended at: {new Date(mock.endAt).toLocaleString()}
                  </div>
                )}
              </div>

              <div className="mock-card-actions">
                <button 
                  onClick={() => navigate(`/admin/edit-mock/${mock._id}`)}
                  className="action-btn edit-action"
                  disabled={mock.status === 'live'}
                >
                  Edit
                </button>

                {mock.status === 'draft' && (
                  <button 
                    onClick={() => handleMakeLive(mock._id)}
                    className="action-btn live-action"
                  >
                    Make Live
                  </button>
                )}

                {mock.status === 'live' && (
                  <button 
                    onClick={() => handleEndMock(mock._id)}
                    className="action-btn end-action"
                  >
                    End Mock
                  </button>
                )}

                <button 
                  onClick={() => viewStatistics(mock._id)}
                  className="action-btn stats-action"
                >
                  Statistics
                </button>

                <button 
                  onClick={() => handleDelete(mock._id)}
                  className="action-btn delete-action"
                  disabled={mock.status === 'live'}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Statistics Modal */}
      {showStatistics && statistics && (
        <div className="modal-overlay" onClick={closeStatistics}>
          <div className="statistics-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{statistics.mock.title} - Statistics</h3>
              <button onClick={closeStatistics} className="close-btn">✕</button>
            </div>

            <div className="modal-body">
              <div className="stats-summary">
                <div className="stat-card">
                  <h4>Total Attempts</h4>
                  <p className="stat-value">{statistics.statistics.totalAttempts}</p>
                </div>
                <div className="stat-card">
                  <h4>Submitted</h4>
                  <p className="stat-value">{statistics.statistics.submitted}</p>
                </div>
                <div className="stat-card">
                  <h4>In Progress</h4>
                  <p className="stat-value">{statistics.statistics.inProgress}</p>
                </div>
                <div className="stat-card">
                  <h4>Avg. Marks</h4>
                  <p className="stat-value">{statistics.statistics.averageMarks}</p>
                </div>
                <div className="stat-card">
                  <h4>Avg. Percentage</h4>
                  <p className="stat-value">{statistics.statistics.averagePercentage}%</p>
                </div>
              </div>

              <h4>Student Attempts</h4>
              <div className="attempts-table">
                <table>
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Email</th>
                      <th>Marks</th>
                      <th>Percentage</th>
                      <th>Status</th>
                      <th>Exit Count</th>
                      <th>Started At</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statistics.statistics.attempts.map((attempt, index) => (
                      <tr key={index}>
                        <td>{attempt.studentName}</td>
                        <td>{attempt.studentEmail}</td>
                        <td>{attempt.marksObtained}/{attempt.totalMarks}</td>
                        <td>{attempt.percentage}%</td>
                        <td>
                          <span className={`status-badge ${attempt.status}`}>
                            {attempt.status}
                          </span>
                        </td>
                        <td>{attempt.exitFullscreenCount}</td>
                        <td>{new Date(attempt.startTime).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminLayout>
  );
};

export default ManageMocks;
