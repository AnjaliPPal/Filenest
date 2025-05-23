# Email Configuration Guide for FileNest

## Problem: Emails Not Being Sent

The application is currently configured with both SendGrid and Gmail SMTP settings, causing conflicts. The logs show a Gmail authentication error: `Invalid login: 535-5.7.8 Username and Password not accepted.`

## Solution

We've implemented a unified email service that prioritizes SendGrid and falls back to direct SMTP if needed. Follow these steps to fix your email delivery:

### Option 1: Use SendGrid (Recommended)

1. Get a SendGrid API key from https://sendgrid.com/ (free tier available)
2. Update your `.env` file with:
   ```
   SENDGRID_API_KEY=your_sendgrid_api_key
   SENDGRID_FROM_EMAIL=your_verified_sender_email@example.com
   SENDGRID_FROM_NAME=FileNest
   ```
3. Remove or comment out all `EMAIL_*` variables to avoid confusion

### Option 2: Use Gmail SMTP

If you prefer to use Gmail, you need an App Password:

1. Enable 2-Step Verification on your Google account
2. Create an App Password: Google Account > Security > App passwords
3. Update your `.env` file with:
   ```
   # Comment out or remove SendGrid settings
   # SENDGRID_API_KEY=...
   
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_16_character_app_password
   EMAIL_FROM=your_gmail@gmail.com
   ```

## Implementation Changes

The following changes have been made to fix the email system:

1. Created a unified `emailService.ts` that tries SendGrid first, then falls back to SMTP
2. Updated all references in controllers and schedulers to use this service
3. Improved logging and error handling for email delivery
4. Removed conflicting references to multiple email services

## Testing Email Delivery

To test if emails are working:

1. Start the server: `npm run dev`
2. Create a new file request with your email
3. Upload a file to that request
4. Check if you receive both the reminder and the file notification emails

If emails are still not working, check the server logs for specific error messages.

## Common Errors

- `Invalid login`: Your Gmail password is incorrect or you need to use an App Password
- `EAUTH`: Authentication failed, check your credentials
- No email service configured: You need to set either SendGrid or SMTP settings

For SendGrid errors related to sender identity, make sure your sender email is verified in your SendGrid account. 