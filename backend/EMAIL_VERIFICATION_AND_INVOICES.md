# Email Features Documentation

## Overview
This document describes two new email features implemented in the SoulADC LMS:
1. **Email Verification with OTP** - Required during user registration
2. **Automated Invoice/Bill Emails** - Sent after successful course/mock purchase approval

---

## 1. Email Verification with OTP

### Purpose
Ensures that users register with valid email addresses and prevents spam registrations.

### How It Works

#### Registration Flow:
1. User registers with name, email, password, and optional phone
2. System generates a 6-digit OTP and saves it to the user's record
3. OTP email is automatically sent to the user's email address
4. User cannot log in until email is verified
5. User enters the OTP on the frontend to verify their email

#### API Endpoints:

##### 1. Register User
**POST** `/api/auth/register`

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "phone": "+61412345678"
}
```

**Response (Success):**
```json
{
  "message": "User registered successfully. Please verify your email with the OTP sent to your email address.",
  "requiresVerification": true,
  "email": "john@example.com"
}
```

**Note:** OTP is automatically sent via email during registration.

##### 2. Resend Verification OTP
**POST** `/api/auth/send-verification-otp`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "message": "Verification OTP sent to your email"
}
```

##### 3. Verify Email with OTP
**POST** `/api/auth/verify-email-otp`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response (Success):**
```json
{
  "message": "Email verified successfully! You can now log in.",
  "success": true
}
```

**Response (Invalid OTP):**
```json
{
  "message": "Invalid OTP",
  "attemptsRemaining": 4
}
```

#### Login Behavior:
- If user tries to log in before email verification, they receive:
```json
{
  "message": "Please verify your email before logging in. Check your email for the verification OTP.",
  "requiresVerification": true,
  "email": "john@example.com"
}
```
- HTTP Status: `403 Forbidden`

#### Security Features:
- OTP expires after **10 minutes**
- Maximum **5 attempts** allowed per OTP
- After 5 failed attempts, user must request a new OTP
- Admin accounts are automatically marked as verified

#### Database Fields (User Model):
```javascript
{
  verificationOTP: String,           // 6-digit OTP
  verificationOTPExpire: Date,       // Expiration timestamp
  verificationOTPAttempts: Number,   // Failed attempt counter
  isEmailVerified: Boolean           // Verification status
}
```

---

## 2. Automated Invoice/Bill Emails

### Purpose
Provides students with professional payment receipts/invoices after their course or mock exam purchase is approved by an admin.

### How It Works

#### Payment & Invoice Flow:
1. Student completes Stripe payment for a course/mock
2. Payment goes to "pending approval" status
3. Admin approves the payment in the admin dashboard
4. System:
   - Grants access to the course/mock
   - Sends notification to student
   - **Automatically sends invoice/bill email to student**

#### Invoice Email Features:
- Professional HTML template with gradient design
- Contains all transaction details:
  - Invoice number (derived from transaction ID)
  - Purchase date
  - Transaction ID
  - Item details (course/mock title, type)
  - Amount paid (in AUD)
  - Course expiry date (for courses)
  - Customer information (name, email)
- Responsive design (works on mobile and desktop)
- Brand colors and styling

#### Invoice Email Example Content:

**Subject:** `Payment Receipt - [Course/Mock Title]`

**Content includes:**
- Header with SoulADC LMS branding
- Greeting with student name
- Invoice Details section:
  - Invoice Number: #CS01ABCD1234
  - Date of Purchase: January 14, 2026
  - Transaction ID: cs_01_abc123def456...
- Course/Mock Information section:
  - Name, Type, Valid Until (if applicable)
- Amount Paid section: AUD $149.00
- Customer Information section
- "What's Next?" section with guidance
- Footer with copyright and automated email notice

#### Code Implementation:

**Email Template Generator:**
Located in: `backend/src/utils/emailTemplates.js`

```javascript
const { generateInvoiceEmail } = require('../utils/emailTemplates');

const invoiceHtml = generateInvoiceEmail({
  userName: "John Doe",
  userEmail: "john@example.com",
  itemTitle: "Complete Web Development Course",
  itemType: "course", // or "mock"
  amount: 149.00,
  purchaseDate: new Date(),
  transactionId: "cs_01_abc123def456",
  expiryDate: new Date('2027-01-14') // null for mocks
});
```

**Automatic Sending:**
The invoice email is automatically sent in the admin approval route:
- File: `backend/src/routes/adminRoutes.js`
- Route: `POST /api/admin/approve-payment/:userId/:approvalId`

#### Error Handling:
- If email sending fails, it's logged but doesn't block the approval process
- Admin approval and access granting still succeed
- Error is logged: `❌ Error sending invoice email: [error details]`

---

## Email Configuration

Both features use the same email service configuration (Amazon SES SMTP).

### Required Environment Variables:
```env
SES_SMTP_HOST=email-smtp.ap-southeast-2.amazonaws.com
SES_SMTP_PORT=587
SES_SMTP_USERNAME=your_smtp_username
SES_SMTP_PASSWORD=your_smtp_password
SES_FROM_EMAIL=no-reply@souladc.com
```

### Email Utility:
Located in: `backend/src/utils/sendEmail.js`

```javascript
const sendEmail = require('../utils/sendEmail');

await sendEmail(
  recipientEmail,
  'Subject Line',
  htmlContent
);
```

---

## Frontend Integration Guide

### Registration & Verification Flow:

```javascript
// 1. Register user
const registerResponse = await fetch('/api/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name, email, password, phone
  })
});

const registerData = await registerResponse.json();

if (registerData.requiresVerification) {
  // Show OTP verification form
  // User should check their email for OTP
}

// 2. Verify OTP
const verifyResponse = await fetch('/api/auth/verify-email-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: userEmail,
    otp: enteredOTP
  })
});

const verifyData = await verifyResponse.json();

if (verifyData.success) {
  // Redirect to login
  // User can now log in
}

// 3. Resend OTP if needed
const resendResponse = await fetch('/api/auth/send-verification-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: userEmail
  })
});
```

### Login Error Handling:

```javascript
const loginResponse = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

if (loginResponse.status === 403) {
  const data = await loginResponse.json();
  if (data.requiresVerification) {
    // Show "Email not verified" message
    // Provide option to resend OTP
    // Show OTP verification form
  }
}
```

---

## Testing

### Test Email Verification:

1. Register a new user
2. Check email for 6-digit OTP
3. Try logging in without verification (should fail with 403)
4. Verify email with OTP
5. Log in successfully

### Test Invoice Email:

1. Make a test course purchase (use Stripe test cards)
2. Go to admin dashboard → Pending Approvals
3. Approve the payment
4. Check student's email for invoice/receipt
5. Verify all details are correct in the invoice

### Test OTP Expiration:

1. Register user and get OTP
2. Wait 11 minutes
3. Try to verify with OTP (should fail)
4. Request new OTP
5. Verify with new OTP

### Test OTP Attempts:

1. Register user and get OTP
2. Enter wrong OTP 5 times
3. 6th attempt should be blocked
4. Request new OTP to continue

---

## Troubleshooting

### Email Not Received:
1. Check spam/junk folder
2. Verify SES credentials in environment variables
3. Check email is verified in Amazon SES (if in sandbox mode)
4. Check backend logs for email sending errors

### OTP Not Working:
1. Ensure OTP hasn't expired (10 minutes)
2. Check if user exceeded 5 attempts
3. Verify email address matches exactly
4. Try requesting a new OTP

### Invoice Email Not Sent:
1. Check backend logs for email errors
2. Verify approval was successful (access still granted even if email fails)
3. Admin can manually resend if needed
4. Check SES sending limits

---

## Security Considerations

1. **OTP Security:**
   - OTPs are 6 digits (1 million combinations)
   - 10-minute expiration
   - 5-attempt limit prevents brute force
   - OTPs are stored in database (not exposed in API responses)

2. **Email Verification:**
   - Required for all non-admin users
   - Cannot be bypassed (enforced at login)
   - Admin accounts auto-verified

3. **Invoice Security:**
   - Only sent after admin approval
   - Contains transaction ID for verification
   - Sent to verified email addresses only

---

## Future Enhancements

Potential improvements for these features:

1. **Email Templates:**
   - Add company logo
   - Customizable branding
   - Multiple language support

2. **OTP Improvements:**
   - SMS OTP option
   - Email + SMS dual verification
   - Backup codes

3. **Invoice Features:**
   - PDF attachment option
   - Invoice history download
   - Tax information (GST)
   - Multiple currency support

4. **Notifications:**
   - In-app notification when invoice is ready
   - Email delivery status tracking
   - Resend invoice option in user dashboard

---

## Support

For issues or questions regarding these features, contact the development team or refer to:
- Backend Email Setup: `backend/EMAIL_SETUP.md`
- Email Utility: `backend/src/utils/sendEmail.js`
- Email Templates: `backend/src/utils/emailTemplates.js`
- Auth Controller: `backend/src/controllers/authcontroller.js`
- Admin Routes: `backend/src/routes/adminRoutes.js`
