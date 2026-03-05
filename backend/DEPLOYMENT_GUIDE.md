# 🚀 Deployment Guide - Email Verification & Invoice Features

## Overview
This guide walks you through deploying the new email verification and invoice features to your production environment.

---

## ⚠️ Pre-Deployment Checklist

### 1. Environment Variables
Ensure all required environment variables are set in your production environment:

```env
# Email Service (Amazon SES SMTP)
SES_SMTP_HOST=email-smtp.ap-southeast-2.amazonaws.com
SES_SMTP_PORT=587
SES_SMTP_USERNAME=your_smtp_username
SES_SMTP_PASSWORD=your_smtp_password
SES_FROM_EMAIL=no-reply@souladc.com

# Database
MONGO_URI=your_mongodb_connection_string

# JWT
JWT_SECRET=your_jwt_secret

# Frontend
FRONTEND_URL=https://yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
```

### 2. Amazon SES Setup
- ✅ Verify your sending email address in Amazon SES
- ✅ If in sandbox mode, verify recipient email addresses
- ✅ Request production access if needed (to send to any email)
- ✅ Set up DKIM and SPF records for better deliverability

### 3. Database Backup
Before deploying, backup your MongoDB database:
```bash
mongodump --uri="your_mongodb_connection_string" --out=./backup
```

---

## 📦 Deployment Steps

### Step 1: Deploy Backend Code

1. **Pull the latest code:**
```bash
git pull origin main
```

2. **Install dependencies (if needed):**
```bash
cd backend
npm install
```

3. **Verify no errors:**
```bash
npm run dev
```

### Step 2: Migrate Existing Users

**IMPORTANT:** Run this script to mark all existing users as email verified (so they don't get locked out):

```bash
cd backend
node src/utils/markExistingUsersVerified.js
```

**Expected Output:**
```
✅ Connected to MongoDB
Found 15 users to mark as verified
✅ Successfully updated 15 users
All existing users are now marked as email verified

Details:
- Total users found: 15
- Users updated: 15

Sample of verified users:
1. John Doe (john@example.com) - Role: user
2. Jane Smith (jane@example.com) - Role: user
3. Admin (admin@souladc.com) - Role: admin
...
```

⚠️ **Only run this script ONCE during initial deployment!**

### Step 3: Test Email Functionality

#### Test 1: Registration OTP
1. Register a new test user
2. Check email for 6-digit OTP
3. Verify the OTP code is received within seconds
4. Attempt login before verification (should fail)
5. Verify email with OTP
6. Login successfully

#### Test 2: Invoice Email
1. Create a test payment with Stripe test card
2. Approve the payment as admin
3. Check test user's email for invoice
4. Verify all details are correct in the invoice

### Step 4: Monitor Logs

After deployment, monitor your backend logs for:
- ✅ Email sending confirmations: `✅ Email sent successfully`
- ✅ OTP verifications: `✅ Email verified for [email]`
- ✅ Invoice emails: `✅ Invoice email sent to [email]`
- ❌ Any email errors: `❌ Error sending email`

---

## 🔄 Rolling Back (If Needed)

If you encounter issues and need to roll back:

### Option 1: Disable Email Verification Temporarily

Edit `backend/src/controllers/authcontroller.js`:

In the `login` function, comment out the email verification check:
```javascript
// Temporarily disabled for rollback
/*
if (user.role !== "admin" && !user.isEmailVerified) {
  return res.status(403).json({ 
    message: "Please verify your email before logging in.",
    requiresVerification: true,
    email: email
  });
}
*/
```

### Option 2: Mark All Users as Verified
Run the migration script again:
```bash
node backend/src/utils/markExistingUsersVerified.js
```

### Option 3: Full Rollback
```bash
git revert HEAD
npm install
npm run dev
```

---

## 🧪 Testing in Production

### Test User Flow (Registration)
1. Go to registration page
2. Fill in details with a real email you have access to
3. Submit registration
4. Check email for OTP (check spam folder too)
5. Enter OTP on verification page
6. Try to log in
7. Should succeed after verification

### Test Payment Flow (Invoice)
1. Log in as a test user
2. Purchase a course/mock (use Stripe test card in test mode)
3. Log in as admin
4. Go to Pending Approvals
5. Approve the payment
6. Check test user's email for invoice
7. Verify invoice looks professional and contains correct info

---

## 📊 Monitoring & Analytics

### Key Metrics to Monitor

1. **Email Delivery Rate**
   - Check Amazon SES console for bounce/complaint rates
   - Should be < 5% bounce rate

2. **OTP Verification Success Rate**
   - Monitor how many users complete email verification
   - Track failed attempts

3. **Invoice Email Delivery**
   - Ensure invoices are sent after every approval
   - Check for email sending errors in logs

### Database Queries for Monitoring

```javascript
// Count verified vs unverified users
db.users.count({ isEmailVerified: true })
db.users.count({ isEmailVerified: false })

// Find users with pending OTP verifications
db.users.find({ 
  isEmailVerified: false,
  verificationOTP: { $exists: true }
}).count()

// Find recent registrations
db.users.find({ 
  createdAt: { $gte: new Date("2026-01-14") }
}).sort({ createdAt: -1 })
```

---

## 🐛 Troubleshooting

### Issue: Users Can't Receive OTP Emails

**Possible Causes:**
1. SES is in sandbox mode (can only send to verified emails)
2. SES credentials are incorrect
3. Email is being marked as spam
4. Rate limits exceeded

**Solutions:**
1. Request production access from AWS SES
2. Verify SES credentials in environment variables
3. Set up DKIM and SPF records for your domain
4. Check SES sending limits and quota

**Quick Test:**
```bash
# Test email sending directly
cd backend
node test-email.js  # Create this test script if needed
```

### Issue: Invoice Emails Not Sent

**Check:**
1. Backend logs for `❌ Error sending invoice email`
2. Admin approval was successful (user should still have access)
3. User's email address is valid
4. SES sending limits

**Fix:**
- Invoice sending is non-blocking, so approval still works
- Admin can manually resend invoice if needed
- Check backend logs for specific error

### Issue: Existing Users Can't Log In

**Cause:** Existing users marked as unverified

**Fix:**
Run the migration script:
```bash
node backend/src/utils/markExistingUsersVerified.js
```

Or manually update in MongoDB:
```javascript
db.users.updateMany(
  { isEmailVerified: { $ne: true } },
  { $set: { isEmailVerified: true } }
)
```

---

## 🔐 Security Considerations

### Production Checklist:
- ✅ Use strong JWT_SECRET (minimum 32 characters)
- ✅ Enable HTTPS only (no HTTP)
- ✅ Set proper CORS origins (not `*`)
- ✅ Use environment variables (never hardcode secrets)
- ✅ Enable rate limiting on auth endpoints
- ✅ Monitor for brute force attempts on OTP verification
- ✅ Set up email sending alerts in Amazon SES
- ✅ Regular database backups
- ✅ Keep dependencies updated

### Recommended Rate Limits:
```javascript
// Add to your auth routes
const rateLimit = require('express-rate-limit');

const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 OTP requests per 15 minutes
  message: 'Too many OTP requests, please try again later'
});

router.post('/send-verification-otp', otpLimiter, sendVerificationOTP);
router.post('/verify-email-otp', otpLimiter, verifyEmailOTP);
```

---

## 📧 Email Deliverability Best Practices

### 1. Domain Authentication
- Set up SPF record: `v=spf1 include:amazonses.com ~all`
- Configure DKIM in Amazon SES
- Add DMARC policy: `v=DMARC1; p=quarantine; rua=mailto:postmaster@yourdomain.com`

### 2. Content Best Practices
- ✅ Include plain text version (currently HTML only)
- ✅ Keep emails under 100KB
- ✅ Use proper HTML structure (already implemented)
- ✅ Include unsubscribe link (not needed for transactional emails)
- ✅ Avoid spam trigger words

### 3. Monitoring
- Set up bounce and complaint notifications in SES
- Monitor reputation dashboard
- Track delivery rates

---

## 📱 Frontend Integration

### Required Frontend Changes:

#### 1. Registration Page
- Add OTP verification modal/page
- Show "Check your email" message after registration
- Provide "Resend OTP" button
- Handle verification success/failure

#### 2. Login Page
- Handle 403 response for unverified emails
- Show "Email not verified" message
- Provide link to verification page
- Option to resend OTP

#### 3. User Experience
- Clear instructions about checking email
- Countdown timer for OTP expiration (10 minutes)
- Attempt counter (5 attempts max)
- Success confirmation after verification

### Example UI Flow:

```
[Register] → [Check Email Message] → [Enter OTP] → [Verified!] → [Login]
              ↓                         ↓
              [Resend OTP]              [5 attempts left]
```

---

## 📝 Documentation for Your Team

Share these documents with your team:
1. `EMAIL_VERIFICATION_AND_INVOICES.md` - Full feature documentation
2. `API_ENDPOINTS_REFERENCE.md` - API quick reference
3. `DEPLOYMENT_GUIDE.md` - This file

---

## ✅ Post-Deployment Checklist

After deploying to production:

- [ ] Run user migration script
- [ ] Test registration with real email
- [ ] Verify OTP email received
- [ ] Test email verification flow
- [ ] Test login before verification (should fail)
- [ ] Test login after verification (should succeed)
- [ ] Create test payment
- [ ] Approve test payment as admin
- [ ] Verify invoice email received
- [ ] Check invoice formatting on mobile
- [ ] Monitor logs for 24 hours
- [ ] Check SES dashboard for delivery rates
- [ ] Update frontend to handle new responses
- [ ] Inform users about new verification requirement
- [ ] Set up monitoring alerts

---

## 🆘 Support & Escalation

### If Something Goes Wrong:

1. **Check Logs First**
   ```bash
   pm2 logs backend  # if using pm2
   # or
   tail -f /var/log/backend.log
   ```

2. **Quick Fixes:**
   - Mark all users as verified (migration script)
   - Check email credentials
   - Verify database connection
   - Restart backend service

3. **Emergency Rollback:**
   - Comment out email verification check in login
   - Mark all users as verified
   - Deploy hotfix

4. **Contact:**
   - Development team
   - AWS Support (for SES issues)
   - Database administrator

---

## 🎉 Success Criteria

Your deployment is successful when:

- ✅ New users receive OTP emails within seconds
- ✅ OTP verification works correctly
- ✅ Existing users can log in without issues
- ✅ Unverified users are blocked from logging in
- ✅ Invoice emails are sent after payment approval
- ✅ Invoice emails look professional and contain correct data
- ✅ No errors in production logs
- ✅ Email delivery rate > 95%
- ✅ Zero complaints about locked accounts

---

## 📞 Need Help?

If you encounter any issues during deployment:
1. Check the troubleshooting section above
2. Review backend logs for specific errors
3. Test email sending independently
4. Verify all environment variables are set correctly
5. Contact the development team with log details

---

**Good luck with your deployment! 🚀**

---

**Last Updated:** January 14, 2026
**Version:** 1.0
