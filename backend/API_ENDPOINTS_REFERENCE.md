# API Endpoints Quick Reference

## Email Verification & Invoice Features

### Authentication Endpoints

#### 1. Register User (with Email Verification)
```
POST /api/auth/register
```

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+61412345678"  // optional
}
```

**Response (201):**
```json
{
  "message": "User registered successfully. Please verify your email with the OTP sent to your email address.",
  "requiresVerification": true,
  "email": "john@example.com"
}
```

**Note:** A 6-digit OTP is automatically sent to the user's email.

---

#### 2. Send Verification OTP (Resend)
```
POST /api/auth/send-verification-otp
```

**Request:**
```json
{
  "email": "john@example.com"
}
```

**Response (200):**
```json
{
  "message": "Verification OTP sent to your email"
}
```

---

#### 3. Verify Email with OTP
```
POST /api/auth/verify-email-otp
```

**Request:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (200) - Success:**
```json
{
  "message": "Email verified successfully! You can now log in.",
  "success": true
}
```

**Response (400) - Invalid OTP:**
```json
{
  "message": "Invalid OTP",
  "attemptsRemaining": 4
}
```

**Response (400) - Expired:**
```json
{
  "message": "OTP has expired. Please request a new one."
}
```

**Response (400) - Too Many Attempts:**
```json
{
  "message": "Too many incorrect attempts. Please request a new OTP."
}
```

---

#### 4. Login
```
POST /api/auth/login
```

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response (200) - Success:**
```json
{
  "message": "Login successful",
  "token": "jwt_token_here",
  "role": "user",
  "user": {
    "id": "user_id",
    "email": "john@example.com",
    "role": "user",
    "name": "John Doe",
    "purchasedCourses": [],
    "purchasedMocks": [],
    "streak": {
      "current": 5,
      "highest": 10,
      "lastLoginDate": "2026-01-14"
    }
  },
  "notifications": []
}
```

**Response (403) - Email Not Verified:**
```json
{
  "message": "Please verify your email before logging in. Check your email for the verification OTP.",
  "requiresVerification": true,
  "email": "john@example.com"
}
```

**Response (400) - Invalid Credentials:**
```json
{
  "message": "Invalid email or password"
}
```

---

### Admin Endpoints (Payment Approval with Invoice Email)

#### Approve Payment & Send Invoice
```
POST /api/admin/approve-payment/:userId/:approvalId
```

**Headers:**
```
Authorization: Bearer <admin_jwt_token>
```

**URL Parameters:**
- `userId`: MongoDB ObjectId of the user
- `approvalId`: MongoDB ObjectId of the pending approval

**Response (200):**
```json
{
  "success": true,
  "message": "Payment approved and course access granted",
  "itemTitle": "Complete Web Development Course",
  "userName": "John Doe"
}
```

**What Happens:**
1. Payment approval is processed
2. User gains access to course/mock
3. In-app notification is created
4. **Invoice/bill email is automatically sent to user's email**

**Invoice Email Contains:**
- Professional HTML template
- Invoice number and transaction details
- Course/mock information
- Amount paid (AUD)
- Purchase and expiry dates
- Customer information

---

## Frontend Integration Examples

### Registration & Verification Flow

```javascript
// Step 1: Register
async function registerUser(formData) {
  try {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (response.ok && data.requiresVerification) {
      // Show OTP verification screen
      showOTPVerificationForm(data.email);
    }
  } catch (error) {
    console.error('Registration error:', error);
  }
}

// Step 2: Verify OTP
async function verifyOTP(email, otp) {
  try {
    const response = await fetch('/api/auth/verify-email-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });
    
    const data = await response.json();
    
    if (data.success) {
      // Redirect to login
      showSuccessMessage('Email verified! Please log in.');
      redirectToLogin();
    } else {
      showError(data.message);
    }
  } catch (error) {
    console.error('Verification error:', error);
  }
}

// Step 3: Resend OTP if needed
async function resendOTP(email) {
  try {
    const response = await fetch('/api/auth/send-verification-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    showSuccessMessage(data.message);
  } catch (error) {
    console.error('Resend OTP error:', error);
  }
}
```

### Login with Verification Check

```javascript
async function login(email, password) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (response.status === 403 && data.requiresVerification) {
      // Email not verified
      showEmailVerificationRequired(data.email);
      return;
    }
    
    if (response.ok) {
      // Store token and redirect
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      redirectToDashboard();
    } else {
      showError(data.message);
    }
  } catch (error) {
    console.error('Login error:', error);
  }
}
```

---

## Database Schema Updates

### User Model (userModel.js)

**New Fields Added:**
```javascript
{
  // Email verification fields
  verificationOTP: { type: String },
  verificationOTPExpire: { type: Date },
  verificationOTPAttempts: { type: Number, default: 0 },
  isEmailVerified: { type: Boolean, default: false },
  
  // Existing password reset OTP fields
  resetOTP: { type: String },
  resetOTPExpire: { type: Date },
  resetOTPAttempts: { type: Number, default: 0 }
}
```

---

## Email Templates

### Verification OTP Email
- **Subject:** "Verify Your Email - SoulADC LMS"
- **Contains:** 6-digit OTP code
- **Expiration:** 10 minutes
- **Style:** Clean, professional, gradient design

### Invoice/Receipt Email
- **Subject:** "Payment Receipt - [Course/Mock Title]"
- **Contains:**
  - Invoice number and transaction ID
  - Purchase date and amount
  - Course/mock details
  - Customer information
  - Expiry date (for courses)
  - "What's Next?" guidance
- **Style:** Professional HTML table layout with branding
- **Format:** Responsive (mobile-friendly)

---

## Security Features

### OTP Security
- ✅ 6-digit random OTP (1,000,000 combinations)
- ✅ 10-minute expiration
- ✅ Maximum 5 verification attempts
- ✅ New OTP required after 5 failed attempts
- ✅ OTP stored securely in database (not in API responses)

### Email Verification
- ✅ Required for all non-admin users
- ✅ Enforced at login (cannot bypass)
- ✅ Admin accounts automatically verified
- ✅ Prevents spam registrations

### Invoice Security
- ✅ Only sent after admin approval
- ✅ Sent to verified email addresses
- ✅ Contains unique transaction ID
- ✅ Professional and tamper-evident format

---

## Error Codes & Messages

| Status | Message | Meaning |
|--------|---------|---------|
| 200 | Success messages | Operation successful |
| 201 | User registered successfully | Registration complete, verification required |
| 400 | Missing required fields | Invalid request data |
| 400 | User already exists | Email already registered |
| 400 | Invalid OTP | Wrong OTP entered |
| 400 | OTP has expired | Request new OTP |
| 400 | Too many attempts | Request new OTP (5 attempts exceeded) |
| 400 | Email is already verified | No action needed |
| 403 | Email not verified | Complete verification before login |
| 404 | User not found | Email not registered |
| 500 | Server error | Internal error, check logs |

---

## Testing Checklist

### Email Verification Testing
- [ ] Register new user
- [ ] Receive OTP email within seconds
- [ ] Verify email with correct OTP
- [ ] Try login before verification (should fail)
- [ ] Try login after verification (should succeed)
- [ ] Test OTP expiration (wait 11 minutes)
- [ ] Test wrong OTP (should decrement attempts)
- [ ] Test 5 failed attempts (should block)
- [ ] Test resend OTP functionality
- [ ] Test already verified user (should work normally)

### Invoice Email Testing
- [ ] Complete test payment (Stripe test card)
- [ ] Approve payment as admin
- [ ] Receive invoice email
- [ ] Verify all invoice details are correct
- [ ] Check invoice formatting on desktop
- [ ] Check invoice formatting on mobile
- [ ] Verify transaction ID matches
- [ ] Verify amount matches payment
- [ ] Verify course expiry date (if applicable)
- [ ] Test for both courses and mocks

---

## Environment Variables Required

```env
# Email Service (Amazon SES SMTP)
SES_SMTP_HOST=email-smtp.ap-southeast-2.amazonaws.com
SES_SMTP_PORT=587
SES_SMTP_USERNAME=your_smtp_username
SES_SMTP_PASSWORD=your_smtp_password
SES_FROM_EMAIL=no-reply@souladc.com

# JWT for authentication
JWT_SECRET=your_jwt_secret

# Frontend URL for links
FRONTEND_URL=https://yourdomain.com

# Stripe for payments
STRIPE_SECRET_KEY=sk_test_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

---

## Files Modified/Created

### Modified Files:
1. `backend/src/models/userModel.js` - Added OTP verification fields
2. `backend/src/controllers/authcontroller.js` - Added OTP verification logic
3. `backend/src/routes/authRoutes.js` - Added verification routes
4. `backend/src/routes/adminRoutes.js` - Added invoice email sending

### New Files:
1. `backend/src/utils/emailTemplates.js` - Invoice HTML template generator
2. `backend/EMAIL_VERIFICATION_AND_INVOICES.md` - Full documentation
3. `backend/API_ENDPOINTS_REFERENCE.md` - This file

---

## Support & Troubleshooting

### Common Issues

**Issue: OTP email not received**
- Check spam/junk folder
- Verify SES credentials
- Check if email is verified in SES (sandbox mode)
- Check backend logs for errors

**Issue: Login blocked after verification**
- Ensure OTP was verified successfully
- Check `isEmailVerified` field in database
- Try resending OTP and verifying again

**Issue: Invoice email not received**
- Check if payment was approved successfully
- Check backend logs for email errors
- Verify user has access to course/mock
- SES might have sending limits

**Issue: OTP expired immediately**
- Check server time/timezone
- Verify system clock is correct
- Check OTP expiration calculation

---

## Contact

For technical support or questions:
- Check backend logs for detailed error messages
- Review documentation: `EMAIL_VERIFICATION_AND_INVOICES.md`
- Contact development team

---

**Last Updated:** January 14, 2026
**Version:** 1.0
