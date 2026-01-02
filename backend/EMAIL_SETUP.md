# Email Configuration Guide for SoulADC

## Overview
The forgot password feature uses Amazon SES SMTP to send password reset links to users.

## Amazon SES SMTP Setup

### Step 1: Verify Your Email Address in AWS SES

1. Log in to AWS Console
2. Go to Amazon SES service
3. Navigate to "Verified identities"
4. Click "Create identity"
5. Select "Email address"
6. Enter your sender email address (e.g., noreply@yourdomain.com)
7. Click "Create identity"
8. Check your email and click the verification link

**Note**: If in SES Sandbox mode, also verify recipient email addresses.

### Step 2: Create SMTP Credentials

1. In Amazon SES, go to "SMTP settings"
2. Note the SMTP endpoint for your region (e.g., email-smtp.us-east-1.amazonaws.com)
3. Click "Create SMTP credentials"
4. Enter an IAM user name (e.g., ses-smtp-user)
5. Click "Create"
6. **Download and save the SMTP credentials** (username and password)

### Step 3: Update `.env` File

Add the following to your `.env` file:
```env
SES_SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SES_SMTP_PORT=587
SES_SMTP_USERNAME=your-smtp-username
SES_SMTP_PASSWORD=your-smtp-password
SES_FROM_EMAIL=noreply@yourdomain.com
```

Replace:
- `us-east-1` with your AWS region
- SMTP credentials with the ones you downloaded
- `SES_FROM_EMAIL` with your verified email address

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

# Amazon SES SMTP Configuration
SES_SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SES_SMTP_PORT=587
SES_SMTP_USERNAME=your-smtp-username
SES_SMTP_PASSWORD=your-smtp-password
SES_FROM_EMAIL=noreply@yourdomain.com
```

## Important Notes

- **Never commit real credentials** to version control
- Use environment variables for all sensitive data
- For production, use a professional SMTP service
- Test thoroughly before deploying to production
