# Contact Form Setup Guide

This guide will help you set up the contact form backend to send emails when users submit the contact form.

## Prerequisites

- Node.js 16+ installed on your system
- Email account (Gmail recommended for simplicity)

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Email Configuration

Choose one of the following email service options:

#### Option A: Gmail (Recommended)

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the generated 16-character password

3. **Create .env file** with your Gmail credentials:

```bash
cp env.example .env
```

Edit the `.env` file:
```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_APP_PASSWORD=your-16-character-app-password
EMAIL_FROM=contact@jaide.care
EMAIL_TO=contact@jaide.care
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,https://jaide.care,https://www.jaide.care
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

#### Option B: Custom SMTP

If you prefer using a different email provider:

```env
EMAIL_SERVICE=smtp
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@domain.com
SMTP_PASSWORD=your-password
EMAIL_FROM=contact@jaide.care
EMAIL_TO=contact@jaide.care
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,https://jaide.care,https://www.jaide.care
RECAPTCHA_SECRET_KEY=your-recaptcha-secret-key
```

### 3. reCAPTCHA Configuration

1. **Get reCAPTCHA Keys**:
   - Go to [Google reCAPTCHA Admin Console](https://www.google.com/recaptcha/admin)
   - Create a new site or use existing site
   - Get your Site Key and Secret Key

2. **Configure Keys**:
   - The Site Key is already configured in `contact-form.html`
   - Add your Secret Key to the `.env` file as `RECAPTCHA_SECRET_KEY`

### 4. Start the Server

For development:
```bash
npm run dev
```

For production:
```bash
npm start
```

The server will start on port 3000 (or the port specified in your .env file).

## How It Works

### Form Submission Flow

1. **User fills form** → Data is validated client-side
2. **Form submits** → JavaScript sends POST request to `/submit-contact`
3. **Server validates** → Data is validated server-side
4. **Emails sent** → Two emails are sent:
   - Notification to your team (EMAIL_TO address)
   - Confirmation to the user
5. **Response sent** → Success/error message displayed to user

### Email Templates

The system sends two emails:

1. **Team Notification Email**:
   - Contains all form data in a formatted layout
   - Includes contact information and message
   - Sent to the EMAIL_TO address

2. **User Confirmation Email**:
   - Professional confirmation with Jaide branding
   - Includes next steps and demo booking link
   - Sent to the user's email address

### Security Features

- **reCAPTCHA protection**: Google reCAPTCHA v2 prevents bots and spam
- **Rate limiting**: Max 5 submissions per IP per 15 minutes
- **Input validation**: Server-side validation of all fields
- **CORS protection**: Only allowed origins can submit
- **Helmet security**: Additional security headers
- **Data sanitization**: Email addresses are normalized

## Deployment

### Production Deployment

1. **Set environment variables** on your hosting platform
2. **Set NODE_ENV=production**
3. **Update ALLOWED_ORIGINS** to include your production domain
4. **Ensure your email credentials are secure**

### Hosting Recommendations

- **Vercel**: Easy deployment with environment variables
- **Heroku**: Simple setup with add-ons
- **Railway**: Modern hosting platform
- **AWS/DigitalOcean**: For more control

## Troubleshooting

### Common Issues

1. **"Authentication failed" error**:
   - Check Gmail app password is correct
   - Ensure 2FA is enabled on Gmail
   - Verify EMAIL_USER matches the Gmail account

2. **"Form submission failed"**:
   - Check server is running on correct port
   - Verify CORS settings include your domain
   - Check browser console for detailed errors

3. **Emails not sending**:
   - Check spam folder
   - Verify SMTP settings for custom providers

4. **Rate limiting errors**:
   - Wait 15 minutes between submissions
   - Adjust rate limiting in server.js if needed

### Debug Mode

To see detailed logs, add this to your .env:
```env
DEBUG=true
```

## Customization

### Email Templates

Edit the HTML templates in `server.js`:
- Look for `mailToTeam` and `mailToUser` objects
- Modify the HTML content as needed

### Form Fields

To add/modify form fields:
1. Update the HTML form in `contact-form.html`
2. Add validation rules in `server.js`
3. Update email templates to include new fields

### Styling

The form uses existing Webflow styles. To customize:
- Modify CSS classes in `contact-form.html`
- Add custom styles to your CSS files

## Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Ensure all environment variables are correctly set

---

**Security Note**: Never commit your `.env` file to version control. Always use environment variables for sensitive information in production.
