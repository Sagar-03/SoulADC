# Email Configuration Guide for SoulADC

## Overview
The forgot password feature requires email configuration to send password reset links to users.

## Setup Options

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings → Security
   - Under "2-Step Verification", click "App passwords"
   - Select "Mail" and "Other (Custom name)"
   - Generate and copy the 16-character password

3. **Update `.env` file**:
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### Option 2: Custom SMTP Server (Production)

Update your `.env` file with SMTP credentials:
```env
SMTP_HOST=smtp.yourserver.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
```

### Option 3: Development Testing (Ethereal)

If no email configuration is provided, the system automatically uses Ethereal (test email service):
- Emails won't be delivered to real addresses
- Check console for preview URLs
- **Good for testing only**

## Testing the Feature

1. Start your backend server:
```bash
cd backend
npm run dev
```

2. Navigate to the forgot password page in your app
3. Enter a registered email address
4. Check:
   - Console logs for email status
   - Your email inbox for the reset link
   - If using Ethereal, check the console for preview URL

## Troubleshooting

### "Error sending email"
- Verify EMAIL_USER and EMAIL_PASSWORD are correct
- For Gmail, ensure you're using an App Password, not your regular password
- Check if 2FA is enabled on your Gmail account

### "Email not received"
- Check spam/junk folder
- Verify the email address is registered in your database
- Check console logs for email sending status

### Reset Link Expired
- Links expire after 15 minutes
- Request a new reset link if expired

## Environment Variables Reference

```env
# Frontend URL for reset links
FRONTEND_URL=http://localhost:5173

# Gmail Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password

# OR SMTP Configuration
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=username
SMTP_PASSWORD=password

# Email sender (displayed in "From" field)
SES_FROM_EMAIL=info@souladc.com
```

## Important Notes

- **Never commit real credentials** to version control
- Use environment variables for all sensitive data
- For production, use a professional SMTP service
- Test thoroughly before deploying to production
