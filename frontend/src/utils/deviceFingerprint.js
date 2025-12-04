// Frontend Integration Example for Device Security Feature
// File: frontend/src/utils/deviceFingerprint.js

import FingerprintJS from '@fingerprintjs/fingerprintjs';

/**
 * Initialize and get device fingerprint
 * This should be called during login
 */
let fpPromise = null;

export const initializeFingerprint = () => {
  if (!fpPromise) {
    fpPromise = FingerprintJS.load();
  }
  return fpPromise;
};

export const getDeviceFingerprint = async () => {
  try {
    const fp = await initializeFingerprint();
    const result = await fp.get();
    return result.visitorId;
  } catch (error) {
    console.error('Error getting device fingerprint:', error);
    return null;
  }
};

// ==============================================================
// Example Usage in Login Component
// ==============================================================

/*
// File: frontend/src/Pages/Login.jsx

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../Api/api';
import { getDeviceFingerprint } from '../utils/deviceFingerprint';
import { toast } from 'react-toastify';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);

    try {
      // Get device fingerprint
      const deviceFingerprint = await getDeviceFingerprint();
      
      if (!deviceFingerprint) {
        toast.warning('Unable to verify device. Please try again.');
        setLoading(false);
        return;
      }

      // Send login request with device fingerprint
      const response = await api.post('/auth/login', {
        email,
        password,
        deviceFingerprint  // ← IMPORTANT: Include fingerprint
      });

      if (response.data.token) {
        // Store token
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        toast.success('Login successful!');
        
        // Redirect based on role
        if (response.data.role === 'admin') {
          navigate('/admin/dashboard');
        } else {
          navigate('/student/dashboard');
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Handle device lock error specifically
      if (error.response?.status === 403 || 
          error.response?.data?.errorCode === 'DEVICE_LOCK_VIOLATION') {
        toast.error(
          'Login blocked: Unauthorized device or IP. Please contact support to unlock your account.',
          { duration: 8000 }
        );
      } else {
        toast.error(
          error.response?.data?.message || 'Login failed. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin}>
        <h2>Student Login</h2>
        
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        
        <button type="submit" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </button>
        
        <p className="support-text">
          Having trouble logging in? 
          <a href="/contact-support">Contact Support</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
*/

// ==============================================================
// Admin Panel - Reset Device Lock Feature
// ==============================================================

/*
// File: frontend/src/Components/admin/ManageStudents.jsx

import React, { useState, useEffect } from 'react';
import { api } from '../../Api/api';
import { toast } from 'react-toastify';

const ManageStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [resettingDeviceLock, setResettingDeviceLock] = useState(null);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/admin/students', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStudents(response.data.students || []);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const handleResetDeviceLock = async (userId, userName) => {
    if (!window.confirm(`Reset device lock for ${userName}? They will be able to login from a new device.`)) {
      return;
    }

    setResettingDeviceLock(userId);

    try {
      const token = localStorage.getItem('token');
      const response = await api.post(
        `/admin/reset-device-lock/${userId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        toast.success(`Device lock reset for ${userName}`);
        // Optionally refresh student list
        fetchStudents();
      }
    } catch (error) {
      console.error('Reset device lock error:', error);
      toast.error(
        error.response?.data?.message || 'Failed to reset device lock'
      );
    } finally {
      setResettingDeviceLock(null);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  if (loading) return <div>Loading students...</div>;

  return (
    <div className="manage-students">
      <h2>Manage Students</h2>
      
      <table className="students-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Courses</th>
            <th>Device Lock</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student._id}>
              <td>{student.name}</td>
              <td>{student.email}</td>
              <td>{student.purchasedCourses?.length || 0}</td>
              <td>
                {student.registeredIp && student.deviceFingerprint ? (
                  <span className="device-locked">
                    🔒 Locked
                    <small>IP: {student.registeredIp}</small>
                  </span>
                ) : (
                  <span className="device-unlocked">🔓 Unlocked</span>
                )}
              </td>
              <td>
                <button
                  onClick={() => handleResetDeviceLock(student._id, student.name)}
                  disabled={
                    resettingDeviceLock === student._id ||
                    (!student.registeredIp && !student.deviceFingerprint)
                  }
                  className="reset-device-btn"
                  title="Reset device lock"
                >
                  {resettingDeviceLock === student._id 
                    ? 'Resetting...' 
                    : 'Reset Device Lock'
                  }
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ManageStudents;
*/

// ==============================================================
// Installation Instructions
// ==============================================================

/*
1. Install FingerprintJS:
   npm install @fingerprintjs/fingerprintjs

2. Create the utils file:
   Create: frontend/src/utils/deviceFingerprint.js
   Copy the code from above

3. Update Login component:
   - Import getDeviceFingerprint
   - Call it before login API request
   - Include deviceFingerprint in request body
   - Handle 403 errors for device lock

4. Update Admin component:
   - Add "Reset Device Lock" button
   - Call /admin/reset-device-lock/:userId endpoint
   - Show device lock status

5. Test the flow:
   - Login from first device → succeeds, device registered
   - Login from same device → succeeds
   - Login from different device → blocked
   - Admin resets lock → can login from new device
*/

// ==============================================================
// Error Handling Examples
// ==============================================================

/*
// Custom error handler for device lock
export const handleDeviceLockError = (error) => {
  if (error.response?.status === 403) {
    const errorCode = error.response?.data?.errorCode;
    
    if (errorCode === 'DEVICE_LOCK_VIOLATION') {
      return {
        title: 'Device Not Authorized',
        message: 'Your account is locked to another device. Please contact support.',
        actionText: 'Contact Support',
        actionLink: '/contact-support',
        type: 'device_lock'
      };
    }
  }
  
  return {
    title: 'Login Failed',
    message: error.response?.data?.message || 'Please try again',
    type: 'general'
  };
};

// Usage in login:
catch (error) {
  const errorInfo = handleDeviceLockError(error);
  
  if (errorInfo.type === 'device_lock') {
    showModal({
      title: errorInfo.title,
      message: errorInfo.message,
      buttons: [
        {
          text: errorInfo.actionText,
          onClick: () => navigate(errorInfo.actionLink)
        },
        {
          text: 'Cancel',
          onClick: () => closeModal()
        }
      ]
    });
  } else {
    toast.error(errorInfo.message);
  }
}
*/

export default {
  initializeFingerprint,
  getDeviceFingerprint
};
