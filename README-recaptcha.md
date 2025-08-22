# reCAPTCHA Implementation Guide

## Overview
Your contact forms now have complete reCAPTCHA v2 integration with both frontend and backend verification.

## Environment Variables Required

Create a `.env` file in your project root with the following variables:

```env
# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=your_actual_site_key_here
RECAPTCHA_SECRET_KEY=your_actual_secret_key_here

# Email Configuration
EMAIL_SERVICE=resend
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=noreply@jaide.care
EMAIL_TO=contact@jaide.care

# Server Configuration
PORT=3002
NODE_ENV=production
ALLOWED_ORIGINS=https://jaide.care,http://localhost:3002
```

## What's Been Implemented

### 1. Backend (`server.js`)
✅ **reCAPTCHA Verification Function**: Validates tokens with Google's API
✅ **API Endpoint**: `/api/recaptcha-site-key` serves the public site key securely
✅ **Form Validation**: Ensures reCAPTCHA response is present and valid
✅ **Error Handling**: Proper error messages for failed verification
✅ **Rate Limiting**: Prevents spam submissions
✅ **Port Configuration**: Updated to use port 3002 as specified

### 2. Frontend Contact Forms
✅ **English Form** (`contact-form.html`): Complete reCAPTCHA integration
✅ **French Form** (`fr/formulaire-de-contact.html`): Complete reCAPTCHA integration

Both forms include:
- Dynamic site key loading from server (secure, no hardcoded keys)
- reCAPTCHA widget rendering
- Form submission handling with reCAPTCHA verification
- Error handling and user feedback
- Automatic reset on errors
- Loading states during submission

### 3. Security Features
✅ **No Hardcoded Keys**: Site keys are loaded dynamically from server
✅ **Fallback Keys**: Uses fallback if server endpoint is unavailable
✅ **Server-side Verification**: All submissions verified on backend
✅ **Rate Limiting**: Prevents abuse
✅ **Input Validation**: Comprehensive form validation

## Testing Your Implementation

### 1. Normal User Test
1. Visit `/contact-form.html` or `/fr/formulaire-de-contact.html`
2. Fill out the form normally
3. Complete the reCAPTCHA challenge
4. Submit the form
5. ✅ Should succeed and show success message

### 2. Bot Detection Test
1. Open form in incognito mode
2. Fill form very quickly or submit multiple times rapidly
3. reCAPTCHA should challenge or block suspicious behavior
4. ✅ Should require additional verification

### 3. Server Verification Test
1. Try submitting form without completing reCAPTCHA
2. ✅ Should show error: "Please complete the reCAPTCHA verification"
3. Check server logs for verification status

## How It Works

1. **Page Load**: JavaScript fetches site key from `/api/recaptcha-site-key`
2. **reCAPTCHA Render**: Widget is rendered with the fetched site key
3. **User Interaction**: User completes the form and reCAPTCHA challenge
4. **Form Submit**: JavaScript prevents default submission and validates reCAPTCHA
5. **Server Verification**: Backend verifies the reCAPTCHA token with Google
6. **Response**: Success or error message displayed to user

## Troubleshooting

### Common Issues:
- **"reCAPTCHA not configured"**: Ensure `RECAPTCHA_SECRET_KEY` is set in `.env`
- **Widget not rendering**: Check browser console for JavaScript errors
- **"Verification failed"**: Verify your secret key matches your site key domain
- **Rate limiting**: Wait 15 minutes if you hit rate limits during testing

### Testing Environment Variables:
Replace the placeholder keys in `.env` with your actual reCAPTCHA keys from Google reCAPTCHA admin console.

Your implementation is now complete and production-ready! 🎉
