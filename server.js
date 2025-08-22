const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const { Resend } = require('resend');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Resend only if API key is provided
let resend = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

// Security middleware
// Loosen some policies for local dev to allow external scripts (e.g., jQuery CDN)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: 'Too many form submissions from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// CORS configuration
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'https://jaide.care'],
  credentials: true
}));

// Body parser middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files
app.use(express.static('.'));

// reCAPTCHA verification function
const verifyRecaptcha = async (token) => {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;
    if (!secretKey) {
      throw new Error('reCAPTCHA secret key not configured');
    }

    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: secretKey,
        response: token
      }
    });

    return response.data;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false, 'error-codes': ['request-failed'] };
  }
};

// Email transporter configuration
const createTransporter = () => {
  if (process.env.EMAIL_SERVICE === 'gmail') {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
      }
    });
  } else {
    // Generic SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      }
    });
  }
};

// Validation rules
const contactFormValidation = [
  body('First-Name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('First name contains invalid characters'),
  
  body('Last-Name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .withMessage('Last name contains invalid characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('field')
    .notEmpty()
    .withMessage('Please select your job title'),
  
  body('name-2')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Healthcare institution name must be between 2 and 100 characters'),
  
  body('field-2')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Message must not exceed 1000 characters'),
  
  body('checkbox')
    .equals('on')
    .withMessage('You must agree to be contacted by the Jaide team'),
  
  body('g-recaptcha-response')
    .notEmpty()
    .withMessage('Please complete the reCAPTCHA verification')
];

// Contact form submission endpoint
app.post('/submit-contact', limiter, contactFormValidation, async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    // Verify reCAPTCHA
    const recaptchaToken = req.body['g-recaptcha-response'];
    const recaptchaResult = await verifyRecaptcha(recaptchaToken);
    
    if (!recaptchaResult.success) {
      console.error('reCAPTCHA verification failed:', recaptchaResult['error-codes']);
      return res.status(400).json({
        success: false,
        message: 'reCAPTCHA verification failed. Please try again.',
        errors: [{ msg: 'reCAPTCHA verification failed' }]
      });
    }

    const {
      'First-Name': firstName,
      'Last-Name': lastName,
      email,
      field: jobTitle,
      'name-2': institution,
      'field-2': message = ''
    } = req.body;

    // Prepare emails

    // Email to Jaide team
    const mailToTeam = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: process.env.EMAIL_TO || 'contact@jaide.care',
      subject: `New Contact Form Submission from ${firstName} ${lastName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">New Contact Form Submission</h2>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Contact Information</h3>
            <p><strong>Name:</strong> ${firstName} ${lastName}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <p><strong>Job Title:</strong> ${jobTitle}</p>
            <p><strong>Healthcare Institution:</strong> ${institution}</p>
          </div>
          
          ${message ? `
          <div style="background: #fff; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Message</h3>
            <p style="line-height: 1.6;">${message.replace(/\n/g, '<br>')}</p>
          </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>This email was sent from the jaide.care contact form on ${new Date().toLocaleString()}.</p>
          </div>
        </div>
      `
    };

    // Confirmation email to user
    const mailToUser = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to: email,
      subject: 'Thank you for contacting Jaide - We\'ll be in touch soon',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="text-align: center; margin-bottom: 30px;">
            <img src="https://jaide.care/images/jaide-logo---rectangle---no-background.png" alt="Jaide Logo" style="max-width: 200px;">
          </div>
          
          <h2 style="color: #4CAF50;">Thank you for your interest in Jaide!</h2>
          
          <p>Dear ${firstName},</p>
          
          <p>Thank you for reaching out to us. We have received your contact form submission and our team will review your request shortly.</p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">What happens next?</h3>
            <ul style="line-height: 1.6;">
              <li>Our team will review your request within 24 hours</li>
              <li>A member of our team will contact you to discuss your needs</li>
              <li>We can schedule a personalized demo of jaide's AI solutions</li>
            </ul>
          </div>
          
          <p>In the meantime, you can book a demo slot directly using the link below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="https://calendar.notion.so/meet/camille-m52pt1shz/0d4pv3lcz" 
               style="background: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Book a Demo
            </a>
          </div>
          
          <p>If you have any urgent questions, feel free to contact us directly at <a href="mailto:contact@jaide.care">contact@jaide.care</a>.</p>
          
          <p>Best regards,<br>The Jaide Team</p>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
            <p>This is an automated confirmation email. Please do not reply to this email.</p>
            <p>Jaide - AI that cares | <a href="https://jaide.care">jaide.care</a></p>
          </div>
        </div>
      `
    };

    // Send emails via Resend or SMTP based on configuration
    if (process.env.EMAIL_SERVICE === 'resend') {
      if (!resend) {
        throw new Error('Resend service not configured. Please set RESEND_API_KEY in your .env file.');
      }
      const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';
      await Promise.all([
        resend.emails.send({
          from: fromAddress,
          to: mailToTeam.to,
          subject: mailToTeam.subject,
          html: mailToTeam.html
        }),
        resend.emails.send({
          from: fromAddress,
          to: mailToUser.to,
          subject: mailToUser.subject,
          html: mailToUser.html
        })
      ]);
    } else {
      const transporter = createTransporter();
      await transporter.verify();
      await Promise.all([
        transporter.sendMail(mailToTeam),
        transporter.sendMail(mailToUser)
      ]);
    }

    console.log(`Contact form submission from ${firstName} ${lastName} (${email}) processed successfully`);

    res.json({
      success: true,
      message: 'Thank you for your submission. We will get in touch soon!'
    });

  } catch (error) {
    console.error('Error processing contact form:', error);
    
    res.status(500).json({
      success: false,
      message: 'Sorry, there was an error processing your request. Please try again later.'
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    message: 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Contact form server running on port ${PORT}`);
});

module.exports = app;
