# Device and IP Security Feature Documentation

## Overview
This security feature ensures that each student account can only be accessed from the device and IP address where they first logged in. This prevents unauthorized access even if login credentials are compromised.

## How It Works

### First-Time Login
1. Student logs in with email and password
2. System captures:
   - Client IP address
   - Device fingerprint (from FingerprintJS on frontend)
3. System stores these values in the user's database record
4. Login proceeds normally

### Subsequent Logins
1. Student attempts to login
2. System captures current IP and device fingerprint
3. System compares with stored values
4. **If both match** → Login allowed
5. **If either differs** → Login blocked with error message

### Admin Override
- Admins can reset the device lock for any student
- This clears the stored IP and fingerprint
- Student's next login will register the new device

---

## Backend Implementation

### 1. Database Schema Updates

**File:** `backend/src/models/userModel.js`

Added two new fields to the User schema:

```javascript
registeredIp: { 
  type: String, 
  default: null 
},
deviceFingerprint: { 
  type: String, 
  default: null 
}
```

### 2. Login Controller Enhancement

**File:** `backend/src/controllers/authcontroller.js`

The device security check is performed AFTER password verification but BEFORE JWT token generation:

```javascript
// After password verification
const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) {
  return res.status(400).json({ message: "Invalid email or password" });
}

// Device & IP Security Check (only for non-admin users)
if (user.role !== "admin") {
  const currentIp = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                    req.connection.remoteAddress || 
                    req.socket.remoteAddress || 
                    req.ip;
  const currentFingerprint = req.body.deviceFingerprint;

  // First login - store device info
  if (!user.registeredIp && !user.deviceFingerprint) {
    if (currentFingerprint) {
      user.registeredIp = currentIp;
      user.deviceFingerprint = currentFingerprint;
      await user.save();
    }
  } else {
    // Subsequent logins - verify device
    const ipMatches = user.registeredIp === currentIp;
    const fingerprintMatches = user.deviceFingerprint === currentFingerprint;

    if (!ipMatches || !fingerprintMatches) {
      return res.status(403).json({ 
        message: "Login blocked: Unauthorized device or IP.",
        details: "This account is locked to a specific device..."
      });
    }
  }
}
```

### 3. Admin Reset Endpoint

**File:** `backend/src/routes/adminRoutes.js`

**Endpoint:** `POST /api/admin/reset-device-lock/:userId`

**Purpose:** Allows admins to clear device lock for students who need to access from a new device.

**Authentication:** Requires admin role

**Request:**
```http
POST /api/admin/reset-device-lock/507f1f77bcf86cd799439011
Authorization: Bearer <admin-jwt-token>
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Device lock reset successfully. User can now login from a new device.",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john@example.com",
    "deviceLockCleared": true
  }
}
```

**Error Responses:**

- **400 Bad Request:** Invalid user ID format
```json
{
  "success": false,
  "message": "Invalid user ID format"
}
```

- **404 Not Found:** User doesn't exist
```json
{
  "success": false,
  "message": "User not found"
}
```

- **403 Forbidden:** Attempting to reset admin account
```json
{
  "success": false,
  "message": "Cannot reset device lock for admin accounts"
}
```

### 4. Device Security Middleware (Optional)

**File:** `backend/src/middleware/deviceSecurityMiddleware.js`

Helper functions for device security operations:
- `checkDeviceSecurity()` - Validates device and IP
- `clearDeviceLock()` - Clears stored device info
- `getClientIp()` - Extracts client IP from request

---

## Frontend Integration

### 1. Install FingerprintJS

```bash
npm install @fingerprintjs/fingerprintjs
```

### 2. Generate Fingerprint on Login

**Example:** `frontend/src/Pages/Login.jsx`

```javascript
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const Login = () => {
  const handleLogin = async (email, password) => {
    try {
      // Generate device fingerprint
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      const deviceFingerprint = result.visitorId;

      // Send to backend
      const response = await api.post('/auth/login', {
        email,
        password,
        deviceFingerprint  // Include fingerprint
      });

      // Handle response
      if (response.data.token) {
        // Login successful
        localStorage.setItem('token', response.data.token);
        navigate('/dashboard');
      }
    } catch (error) {
      if (error.response?.status === 403) {
        // Device locked
        setError('Login blocked: Unauthorized device or IP. Please contact support.');
      } else {
        setError(error.response?.data?.message || 'Login failed');
      }
    }
  };
};
```

### 3. Handle Device Lock Errors

```javascript
// In your login component
if (error.response?.data?.errorCode === 'DEVICE_LOCK_VIOLATION') {
  // Show specific message to user
  showNotification({
    type: 'error',
    title: 'Device Not Authorized',
    message: 'This account is locked to another device. Please contact support to unlock your account.',
    duration: 10000
  });
}
```

---

## Admin Panel Integration

### Reset Device Lock UI

**Example:** `frontend/src/Components/admin/ManageStudents.jsx`

```javascript
const resetDeviceLock = async (userId) => {
  try {
    const response = await api.post(
      `/admin/reset-device-lock/${userId}`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      }
    );

    if (response.data.success) {
      toast.success('Device lock reset successfully');
      // Refresh student list
      fetchStudents();
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Failed to reset device lock');
  }
};

// In JSX
<button 
  onClick={() => resetDeviceLock(student._id)}
  className="reset-device-btn"
>
  Reset Device Lock
</button>
```

---

## API Reference

### Login with Device Fingerprint

**Endpoint:** `POST /api/auth/login`

**Request Body:**
```json
{
  "email": "student@example.com",
  "password": "password123",
  "deviceFingerprint": "abc123xyz789..."
}
```

**Success Response (200):**
```json
{
  "message": "Login successful",
  "token": "jwt-token-here",
  "role": "user",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "student@example.com",
    "name": "John Doe",
    ...
  }
}
```

**Device Lock Error (403):**
```json
{
  "success": false,
  "message": "Login blocked: Unauthorized device or IP.",
  "details": "This account is locked to a specific device and IP address...",
  "errorCode": "DEVICE_LOCK_VIOLATION"
}
```

---

## Testing Guide

### Test Scenarios

#### 1. First-Time Login
```javascript
// Test with new account
POST /api/auth/login
{
  "email": "newstudent@test.com",
  "password": "test123",
  "deviceFingerprint": "fp_abc123"
}
// Expected: Login succeeds, device is registered
```

#### 2. Same Device Login
```javascript
// Login again with same fingerprint
POST /api/auth/login
{
  "email": "newstudent@test.com",
  "password": "test123",
  "deviceFingerprint": "fp_abc123"
}
// Expected: Login succeeds
```

#### 3. Different Device Login
```javascript
// Login with different fingerprint
POST /api/auth/login
{
  "email": "newstudent@test.com",
  "password": "test123",
  "deviceFingerprint": "fp_xyz789"
}
// Expected: Login blocked with 403 error
```

#### 4. Admin Reset Device Lock
```javascript
// Admin resets device lock
POST /api/admin/reset-device-lock/507f1f77bcf86cd799439011
Headers: { Authorization: "Bearer admin-token" }
// Expected: Success response

// Student can now login from new device
POST /api/auth/login
{
  "email": "newstudent@test.com",
  "password": "test123",
  "deviceFingerprint": "fp_xyz789"
}
// Expected: Login succeeds, new device is registered
```

---

## Security Considerations

### 1. IP Address Changes
- **Issue:** User's IP may change (mobile networks, VPN, ISP rotation)
- **Current Implementation:** Blocks login on IP change
- **Future Enhancement:** Consider allowing IP changes but requiring email verification

### 2. Device Fingerprint Limitations
- Browser updates may change fingerprint
- Incognito mode generates different fingerprints
- Clearing browser data may change fingerprint

### 3. Admin Role Exception
- Admin accounts bypass device lock for flexibility
- Consider adding 2FA for admin accounts as additional security

### 4. Privacy Considerations
- Store only hashed fingerprints (future enhancement)
- Document IP storage in privacy policy
- Provide GDPR-compliant data deletion

---

## Troubleshooting

### Student Can't Login - Device Lock

**Problem:** Student sees "Login blocked: Unauthorized device or IP"

**Solutions:**
1. Admin resets device lock via `/api/admin/reset-device-lock/:userId`
2. Student contacts support
3. Student logs in from original device

### Device Lock Not Working

**Checklist:**
1. ✅ Frontend sending `deviceFingerprint` in login request?
2. ✅ User schema updated with new fields?
3. ✅ Login controller includes device check logic?
4. ✅ FingerprintJS properly initialized?

### Admin Can't Reset Device Lock

**Checklist:**
1. ✅ Admin has valid JWT token?
2. ✅ User ID is valid MongoDB ObjectId?
3. ✅ Target user is not an admin?
4. ✅ Admin endpoint is properly protected?

---

## Future Enhancements

1. **Multiple Device Support**
   - Allow users to register up to 3 devices
   - UI to manage trusted devices

2. **Email Verification on New Device**
   - Send verification email when new device detected
   - Temporary access code to approve new device

3. **Device History Log**
   - Track all login attempts
   - Show device history in user profile

4. **Fingerprint Hashing**
   - Hash device fingerprints before storage
   - Enhanced privacy protection

5. **Flexible IP Matching**
   - Allow IP range instead of exact match
   - Better support for mobile networks

6. **Two-Factor Authentication**
   - Add as secondary security layer
   - Especially for sensitive operations

---

## Support Contact

For questions or issues with the device security feature:
- Backend: Check logs for detailed error messages
- Frontend: Check browser console for FingerprintJS errors
- Admin: Use reset endpoint to unlock accounts

---

## Changelog

### Version 1.0.0 (December 2025)
- Initial implementation
- Device fingerprint + IP validation
- Admin reset endpoint
- First-time device registration
- Security logging

---

## License & Credits

- FingerprintJS: https://github.com/fingerprintjs/fingerprintjs
- Developed for SoulADC LMS
- Security best practices followed
