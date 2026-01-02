# Forgot Password with OTP Implementation - Complete Guide

## ✅ Implementation Summary

A comprehensive forgot password feature has been successfully implemented with OTP verification via email. This feature includes:

### Features Implemented:

1. **Failed Login Detection**: After 1 wrong password attempt, user sees a popup asking if they want to reset password or try again
2. **OTP-Based Password Reset**: Secure 6-digit OTP sent via email
3. **OTP Security**: 
   - OTP is hashed before storage
   - Valid for 10 minutes
   - Maximum 5 verification attempts
   - Single-use (expires after successful verification)
4. **Email Integration**: Using nodemailer for sending OTPs
5. **User-Friendly UI**: Step-by-step process with progress indicator
6. **Forgot Password Link**: Available on login page

---

## 📁 Files Created/Modified

### Backend Files:

#### 1. **User Model** (`backend/src/models/userModel.js`)
**Added OTP fields:**
```javascript
resetOTP: { type: String },
resetOTPExpire: { type: Date },
resetOTPAttempts: { type: Number, default: 0 },
```

#### 2. **Auth Controller** (`backend/src/controllers/authcontroller.js`)
**Added 3 new functions:**
- `sendResetOTP`: Generates and sends 6-digit OTP via email
- `verifyResetOTP`: Verifies the OTP and issues a temporary reset token
- `resetPasswordWithToken`: Resets password after OTP verification

**Security Features:**
- OTP is hashed with bcrypt before storage
- 10-minute expiration
- Maximum 5 attempts per OTP
- Single-use OTP (deleted after verification)

#### 3. **Auth Routes** (`backend/src/routes/authRoutes.js`)
**Added 3 new routes:**
```javascript
POST /auth/send-reset-otp          // Send OTP to email
POST /auth/verify-reset-otp        // Verify OTP
POST /auth/reset-password-with-token // Reset password
```

### Frontend Files:

#### 4. **ForgotPassword Component** 
**Created:** `frontend/src/Components/ForgotPassword/ForgotPassword.jsx`
**Created:** `frontend/src/Components/ForgotPassword/ForgotPassword.css`

**Features:**
- 3-step process: Email → OTP → New Password
- Visual progress indicator
- 10-minute countdown timer
- Resend OTP functionality
- Attempt tracking
- Responsive design

#### 5. **Login Page** (`frontend/src/Pages/Login.jsx`)
**Modified:**
- Added failed login attempt tracking
- Popup after 1 failed login attempt
- "Forgot Password?" link under password field
- Automatic navigation to forgot password flow

#### 6. **App Router** (`frontend/src/App.jsx`)
**Added route:**
```javascript
<Route path="/forgot-password" element={<ForgotPassword />} />
```

---

## 🔧 Configuration Required

### Email Setup (Choose One Method):

#### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password:**
   - Go to Google Account → Security
   - Under "2-Step Verification" → "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password

3. **Update `.env` file:**
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

#### Option 2: Custom SMTP (Production)

Update `.env` file:
```env
SMTP_HOST=smtp.yourserver.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

#### Option 3: Testing (Ethereal - Automatic)
If no email configuration is provided, the system automatically uses Ethereal email testing service. Check console for preview URLs.

---

## 🚀 How to Use

### For Users:

#### Method 1: After Failed Login
1. Try to login with wrong password
2. After 1 failed attempt, popup appears
3. Click "Reset Password"
4. Follow the OTP flow

#### Method 2: Direct Access
1. On login page, click "Forgot Password?" link under password field
2. Enter your registered email
3. Receive 6-digit OTP in email
4. Enter OTP (valid for 10 minutes)
5. Set new password

### For Developers:

1. **Start Backend:**
```bash
cd backend
npm install  # if not installed
npm start
```

2. **Start Frontend:**
```bash
cd frontend
npm install  # if not installed
npm run dev
```

3. **Configure Email:** Update `backend/.env` with your email credentials

---

## 🔐 Security Features

1. **OTP Hashing**: All OTPs are hashed with bcrypt before storage
2. **Time-Limited**: OTP expires after 10 minutes
3. **Attempt Limiting**: Maximum 5 attempts per OTP
4. **Single-Use**: OTP is deleted after successful verification
5. **Password Hashing**: New passwords are hashed automatically by pre-save hook
6. **Reset Token**: After OTP verification, a temporary token is issued for password reset (15 minutes validity)

---

## 📊 Flow Diagram

```
User Forgets Password
        ↓
Enter Email → Send OTP
        ↓
Receive OTP via Email (Valid 10 min)
        ↓
Enter OTP (Max 5 attempts)
        ↓
OTP Verified → Temporary Token Issued
        ↓
Enter New Password
        ↓
Password Reset Complete
        ↓
Redirect to Login
```

---

## 🧪 Testing Checklist

- [ ] Test with valid email
- [ ] Test with invalid/non-existent email
- [ ] Test OTP expiration (after 10 minutes)
- [ ] Test invalid OTP (should limit to 5 attempts)
- [ ] Test OTP reuse (should fail - single use)
- [ ] Test password validation (min 6 characters)
- [ ] Test password mismatch
- [ ] Test "Forgot Password?" link on login page
- [ ] Test failed login popup (after 1 wrong attempt)
- [ ] Test resend OTP functionality
- [ ] Test responsive design on mobile

---

## 📧 Email Template

The OTP email includes:
- User's name
- 6-digit OTP in large, centered format
- 10-minute validity warning
- Professional styling
- SoulADC branding

---

## 🐛 Troubleshooting

### Email Not Sending:
1. Check `.env` configuration
2. Verify Gmail App Password (not regular password)
3. Check console for Ethereal preview URL (if no email config)
4. Ensure port 587/465 is not blocked

### OTP Not Working:
1. Check OTP expiration (10 minutes)
2. Verify attempts remaining (max 5)
3. Ensure OTP is 6 digits
4. Check backend console for errors

### Frontend Errors:
1. Ensure ForgotPassword component is imported correctly
2. Check route configuration in App.jsx
3. Verify API endpoints are accessible

---

## 📝 API Endpoints

### Send OTP
```
POST /api/auth/send-reset-otp
Body: { email: "user@example.com" }
Response: { message: "OTP sent...", email: "..." }
```

### Verify OTP
```
POST /api/auth/verify-reset-otp
Body: { email: "user@example.com", otp: "123456" }
Response: { message: "OTP verified", resetToken: "...", email: "..." }
```

### Reset Password
```
POST /api/auth/reset-password-with-token
Body: { 
  resetToken: "...", 
  email: "user@example.com", 
  newPassword: "newpass123" 
}
Response: { message: "Password reset successful..." }
```

---

## 🎨 UI Features

- Clean, modern design
- Step-by-step progress indicator
- Countdown timer with visual feedback
- Responsive layout (mobile-friendly)
- Loading states for all actions
- Error handling with toast notifications
- Smooth animations and transitions

---

## ✅ Completed Requirements

✓ User enters registered email
✓ Backend generates 6-digit OTP
✓ OTP sent via email (nodemailer)
✓ OTP valid for 10 minutes
✓ OTP stored in hashed form
✓ User enters OTP for verification
✓ After verification, user sets new password
✓ New password hashed and saved securely
✓ OTP is single-use and expires after verification
✓ Security best practices implemented
✓ Failed login tracking (popup after 1 wrong attempt)
✓ Forgot password link on login page

---

## 🎉 Ready to Use!

The forgot password feature is fully implemented and ready for testing. Make sure to configure your email settings in the `.env` file before using in production.

For support or questions, refer to the implementation files or contact the development team.
