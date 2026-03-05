# Frontend Email Verification Guide

## What's New

The registration flow now includes email verification with OTP (One-Time Password).

## User Flow

### Before (Old Flow):
```
Register → Automatically switch to Login
```

### Now (New Flow):
```
Register → Email Verification Screen → Enter OTP → Login
```

## Features Implemented

### 1. **OTP Verification Screen**
After registration, users see:
- 6-digit OTP input field (large, centered, easy to read)
- Email address they registered with
- Expiration notice (10 minutes)
- Resend button with 60-second cooldown timer
- Back to Login option

### 2. **Resend OTP Functionality**
- Disabled for 60 seconds after sending
- Shows countdown timer: "Resend in 59s", "Resend in 58s", etc.
- Becomes active after timer expires
- Sends new OTP and resets timer

### 3. **Enhanced Error Handling**
- Shows remaining attempts when OTP is wrong
- Handles expired OTP errors
- Blocks login for unverified emails (shows verification screen)
- Clear error messages for all scenarios

### 4. **User Experience**
- OTP input automatically filters non-numeric characters
- Limited to 6 digits
- Large, bold, centered text for easy reading
- Auto-focus on OTP input
- Professional styling matching existing design

## Testing the Feature

### Test Registration Flow:

1. **Register New User:**
   - Go to Sign Up tab
   - Fill in all details
   - Click "Create Account"
   - Should see: "Registration successful! Please check your email..."
   - Automatically switches to OTP verification screen

2. **Check Email:**
   - Check your email inbox (and spam folder)
   - You should receive an email with a 6-digit code
   - Example: `123456`

3. **Verify OTP:**
   - Enter the 6-digit code in the verification screen
   - Click "Verify Email"
   - Should see: "Email verified successfully! You can now log in."
   - Automatically switches to Sign In tab

4. **Login:**
   - Enter your email and password
   - Click "Sign In"
   - Should login successfully

### Test Resend OTP:

1. After registration, on the verification screen
2. Click "Resend Code" (if timer hasn't expired, wait)
3. Check email for new code
4. Enter new code and verify

### Test Wrong OTP:

1. Enter wrong code (e.g., `000000`)
2. Should see: "Invalid OTP (4 attempts remaining)"
3. Try again with correct code

### Test Login Before Verification:

1. Register new user
2. Close the modal or go back
3. Try to login without verifying
4. Should see: "Email not verified! Please check your email..."
5. Verification screen should appear

## API Endpoints Used

### 1. Register (Modified)
```
POST /api/auth/register
Response includes: { requiresVerification: true, email: "user@example.com" }
```

### 2. Verify OTP
```
POST /api/auth/verify-email-otp
Body: { email: "user@example.com", otp: "123456" }
```

### 3. Resend OTP
```
POST /api/auth/send-verification-otp
Body: { email: "user@example.com" }
```

### 4. Login (Modified)
```
POST /api/auth/login
Error 403: { requiresVerification: true } - triggers verification screen
```

## Code Changes

### File Modified:
`frontend/src/Pages/Auth.jsx`

### Key Changes:

1. **New State Variables:**
   ```javascript
   const [showOTPVerification, setShowOTPVerification] = useState(false);
   const [otp, setOtp] = useState("");
   const [resendTimer, setResendTimer] = useState(0);
   ```

2. **New Functions:**
   - `handleVerifyOTP()` - Verifies the OTP
   - `handleResendOTP()` - Resends the OTP
   - Timer countdown effect for resend cooldown

3. **Enhanced `handleSubmit()`:**
   - Checks for `requiresVerification` in response
   - Shows OTP screen instead of switching to login
   - Better error handling for unverified emails

4. **Conditional Rendering:**
   - Shows OTP verification screen when `showOTPVerification === true`
   - Shows normal login/signup when `showOTPVerification === false`

## Styling

The OTP verification screen uses existing CSS classes from `Auth.css`:
- `form-header` - For title and subtitle
- `auth-form` - For form container
- `input-group` - For OTP input field
- `submit-btn` - For verify button
- `switch-btn` - For resend and back buttons
- `auth-switch` - For helper text

### Custom Inline Styles:
- OTP input: Large font (24px), letter spacing, centered, bold
- Timer text: Grayed out when disabled
- Small text: For expiration notice

## Error Messages

| Scenario | Message |
|----------|---------|
| Registration Success | "Registration successful! Please check your email..." |
| Verification Success | "Email verified successfully! You can now log in." |
| Invalid OTP | "Invalid OTP (X attempts remaining)" |
| Expired OTP | "OTP has expired. Please request a new one." |
| Too Many Attempts | "Too many incorrect attempts. Please request a new OTP." |
| Unverified Login | "Email not verified! Please check your email..." |
| Resend Success | "New verification code sent!" |
| Resend Cooldown | "Please wait X seconds before requesting a new code" |

## Future Enhancements

Potential improvements:
- [ ] Show OTP input as 6 separate boxes (like typical OTP inputs)
- [ ] Auto-submit when 6 digits entered
- [ ] Paste OTP support (auto-fill all boxes)
- [ ] Show email masking (u***@example.com)
- [ ] Add "Change email" option
- [ ] Visual countdown timer (progress bar)
- [ ] SMS OTP option
- [ ] Remember verified devices

## Troubleshooting

### Issue: OTP Not Received
**Solution:**
- Check spam/junk folder
- Click "Resend Code" button
- Verify email address is correct
- Contact support if persistent

### Issue: "Invalid OTP" Error
**Solution:**
- Ensure you're entering the latest OTP (if resent)
- Check for typos
- OTP is case-sensitive numbers only
- Try resending a new code

### Issue: OTP Expired
**Solution:**
- Click "Resend Code"
- Enter new OTP within 10 minutes

### Issue: Can't Resend
**Solution:**
- Wait for 60-second timer to complete
- Timer shows: "Resend in Xs"
- Button becomes active when timer reaches 0

### Issue: Still Can't Login After Verification
**Solution:**
- Ensure you saw "Email verified successfully!" message
- Try logging out and logging back in
- Clear browser cache
- Contact support

## Developer Notes

### Backend Requirements:
- Backend must send `requiresVerification: true` in registration response
- Backend must return 403 status with `requiresVerification: true` when unverified user tries to login
- Backend OTP APIs must be implemented (already done)

### Environment:
- No additional environment variables needed in frontend
- Backend handles email sending configuration

### Dependencies:
All dependencies already exist:
- `react-toastify` - For notifications
- `react-router-dom` - For navigation
- `axios` - For API calls (via api.js wrapper)

## Support

For issues or questions:
- Check browser console for errors
- Verify backend is running and accessible
- Check network tab for failed API requests
- Review backend logs for email sending errors

---

**Last Updated:** January 14, 2026
**Version:** 1.0
