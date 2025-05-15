// backend/src/utils/email.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configure email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.sendgrid.net',
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

/**
 * Send an email notification
 * @param to Recipient email address
 * @param subject Email subject
 * @param text Email body text
 * @returns Promise resolving to the send info
 */
export const sendNotificationEmail = async (
  to: string,
  subject: string,
  text: string
) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || 'noreply@filerequesttool.com',
      to,
      subject,
      text,
      html: `<div>
        <h2>${subject}</h2>
        <p>${text}</p>
        <p>Visit your dashboard at ${process.env.FRONTEND_URL} to view and download the files.</p>
        <hr>
        <p><small>Powered by File Request Tool</small></p>
      </div>`,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email sending error:', error);
    throw error;
  }
};