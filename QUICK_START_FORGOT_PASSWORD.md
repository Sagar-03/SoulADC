# Quick Start Guide - Forgot Password Feature

## 🚀 Getting Started in 3 Steps

### Step 1: Configure Email (Required)

Open `backend/.env` and update email settings:

```env
# For Gmail (easiest for testing):
EMAIL_USER=youremail@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

**How to get Gmail App Password:**
1. Go to Google Account → Security
2. Enable "2-Step Verification"
3. Go to "App passwords"
4. Create password for "Mail" → "Other"
5. Copy the 16-character password

### Step 2: Start the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm start
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### Step 3: Test the Feature

**Option A: Test Failed Login Popup**
1. Go to http://localhost:5173/login
2. Enter a valid email but wrong password
3. Click "Sign In"
4. After 1 failed attempt, popup appears
5. Click "Reset Password"

**Option B: Direct Access**
1. Go to http://localhost:5173/login
2. Click "Forgot Password?" link below password field
3. Follow the 3-step process:
   - Enter email
   - Enter OTP from email
   - Set new password

---

## 📧 Email Configuration Options

### Development (Gmail - Recommended)
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### Production (Custom SMTP)
```env
SMTP_HOST=smtp.yourserver.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

### Testing Only (No Setup Required)
If you don't configure email, the system will use Ethereal (test email service).
Check backend console for preview URLs.

---

## ✅ Features

- ✓ Failed login detection (popup after 1 wrong attempt)
- ✓ 6-digit OTP via email
- ✓ 10-minute OTP validity
- ✓ Secure OTP hashing
- ✓ 5 attempt limit
- ✓ Single-use OTP
- ✓ Countdown timer
- ✓ Resend OTP option
- ✓ Mobile responsive

---

## 🧪 Quick Test

1. Register a test user (or use existing)
2. Click "Forgot Password?" on login page
3. Enter your email
4. Check your email for OTP (or console if using Ethereal)
5. Enter the 6-digit OTP
6. Set a new password
7. Login with new password

---

## 🐛 Common Issues

**Email not received?**
- Check spam folder
- Verify EMAIL_USER and EMAIL_PASSWORD in .env
- Check backend console for errors
- Try using Ethereal (remove email config from .env)

**OTP expired?**
- OTP is valid for 10 minutes
- Click "Resend OTP" to get a new one

**Too many attempts?**
- Wait and request a new OTP
- OTP resets to 5 attempts on each new request

---

## 📞 Support

For detailed documentation, see: `FORGOT_PASSWORD_IMPLEMENTATION.md`

**API Endpoints:**
- POST `/api/auth/send-reset-otp` - Send OTP
- POST `/api/auth/verify-reset-otp` - Verify OTP  
- POST `/api/auth/reset-password-with-token` - Reset password

**Frontend Routes:**
- `/login` - Login page (with forgot password link)
- `/forgot-password` - Complete forgot password flow

---

## 🎉 You're Ready!

The forgot password feature is fully functional. Just configure your email and start testing!
