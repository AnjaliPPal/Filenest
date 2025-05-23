// backend/src/utils/email.ts
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { UploadedFile } from '../types';

dotenv.config();

// Email configuration
const EMAIL_CONFIG = {
  host: process.env.EMAIL_HOST || 'smtp.example.com',
  port: parseInt(process.env.EMAIL_PORT || '587', 10),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
  },
  from: process.env.EMAIL_FROM || 'filenest@example.com',
};

// Create transporter only once for efficiency
const transporter = nodemailer.createTransport({
  host: EMAIL_CONFIG.host,
  port: EMAIL_CONFIG.port,
  secure: EMAIL_CONFIG.secure,
  auth: EMAIL_CONFIG.auth,
});

/**
 * Send notification to recipient when files are uploaded
 */
export const sendRecipientNotification = async (
  recipientEmail: string,
  requestDescription: string,
  files: UploadedFile[],
  requestId: string
): Promise<boolean> => {
  try {
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.warn('Email not configured. Skipping notification.');
      return false;
    }

    const filesList = files.map(file => 
      `• ${file.filename} (${formatFileSize(file.file_size || 0)})`
    ).join('\n');

    const dashboardLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard`;

    const mailOptions = {
      from: `"FileNest" <${EMAIL_CONFIG.from}>`,
      to: recipientEmail,
      subject: `Files uploaded: ${requestDescription}`,
      text: `
Hello,

Files have been uploaded to your request "${requestDescription}".

Files uploaded:
${filesList}

You can view and download these files from your dashboard:
${dashboardLink}

Thank you for using FileNest!
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #3B82F6; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">FileNest</h1>
  </div>
  <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin-top: 0;">Hello,</p>
    <p>Files have been uploaded to your request "<strong>${requestDescription}</strong>".</p>
    
    <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Files uploaded:</h3>
      <ul style="padding-left: 20px;">
        ${files.map(file => `<li>${file.filename} (${formatFileSize(file.file_size || 0)})</li>`).join('')}
      </ul>
    </div>
    
    <p>You can view and download these files from your dashboard:</p>
    <p style="text-align: center;">
      <a href="${dashboardLink}" 
         style="display: inline-block; background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
         Go to Dashboard
      </a>
    </p>
    
    <p style="margin-bottom: 0; color: #6B7280; font-size: 14px; margin-top: 30px;">Thank you for using FileNest!</p>
  </div>
</div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending recipient notification:', error);
    return false;
  }
};

/**
 * Send confirmation to client who uploaded files
 */
export const sendClientConfirmation = async (
  clientEmail: string,
  requestDescription: string,
  files: UploadedFile[]
): Promise<boolean> => {
  try {
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.warn('Email not configured. Skipping confirmation.');
      return false;
    }

    const filesList = files.map(file => 
      `• ${file.filename} (${formatFileSize(file.file_size || 0)})`
    ).join('\n');

    const mailOptions = {
      from: `"FileNest" <${EMAIL_CONFIG.from}>`,
      to: clientEmail,
      subject: `Upload Confirmation: ${requestDescription}`,
      text: `
Hello,

Your files have been successfully uploaded to the request "${requestDescription}".

Files uploaded:
${filesList}

The recipient has been notified and can access these files.

Thank you for using FileNest!
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #3B82F6; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">FileNest</h1>
  </div>
  <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin-top: 0;">Hello,</p>
    <p>Your files have been successfully uploaded to the request "<strong>${requestDescription}</strong>".</p>
    
    <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
      <h3 style="margin-top: 0;">Files uploaded:</h3>
      <ul style="padding-left: 20px;">
        ${files.map(file => `<li>${file.filename} (${formatFileSize(file.file_size || 0)})</li>`).join('')}
      </ul>
    </div>
    
    <p>The recipient has been notified and can access these files.</p>
    
    <p style="margin-bottom: 0; color: #6B7280; font-size: 14px; margin-top: 30px;">Thank you for using FileNest!</p>
  </div>
</div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending client confirmation:', error);
    return false;
  }
};

/**
 * Send reminder email for pending uploads
 */
export const sendUploadReminder = async (
  clientEmail: string,
  requestDescription: string,
  deadline: string | null,
  uploadLink: string
): Promise<boolean> => {
  try {
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.warn('Email not configured. Skipping reminder.');
      return false;
    }

    const deadlineText = deadline 
      ? `The deadline for uploading files is ${new Date(deadline).toLocaleDateString()}.`
      : 'Please upload the files at your earliest convenience.';

    const mailOptions = {
      from: `"FileNest" <${EMAIL_CONFIG.from}>`,
      to: clientEmail,
      subject: `Reminder: File upload request - ${requestDescription}`,
      text: `
Hello,

This is a friendly reminder about a pending file upload request: "${requestDescription}".

${deadlineText}

You can upload files using this link:
${uploadLink}

Thank you!
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #3B82F6; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">FileNest</h1>
  </div>
  <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin-top: 0;">Hello,</p>
    <p>This is a friendly reminder about a pending file upload request: "<strong>${requestDescription}</strong>".</p>
    
    <p style="color: ${deadline ? '#EF4444' : '#6B7280'};">${deadlineText}</p>
    
    <p>You can upload files using this link:</p>
    <p style="text-align: center;">
      <a href="${uploadLink}" 
         style="display: inline-block; background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
         Upload Files
      </a>
    </p>
    
    <p style="margin-bottom: 0; color: #6B7280; font-size: 14px; margin-top: 30px;">Thank you!</p>
  </div>
</div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending reminder email:', error);
    return false;
  }
};

/**
 * Send notification for expiring file requests
 */
export const sendExpiryNotification = async (params: {
  email: string,
  description: string,
  expiryDate: string,
  unique_link: string
}): Promise<boolean> => {
  try {
    const { email, description, expiryDate, unique_link } = params;
    
    if (!EMAIL_CONFIG.auth.user || !EMAIL_CONFIG.auth.pass) {
      console.warn('Email not configured. Skipping expiry notification.');
      return false;
    }

    const expiryDateFormatted = new Date(expiryDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const uploadLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/upload/${unique_link}`;

    const mailOptions = {
      from: `"FileNest" <${EMAIL_CONFIG.from}>`,
      to: email,
      subject: `File Request Expiring Soon: ${description}`,
      text: `
Hello,

Your file request "${description}" is set to expire on ${expiryDateFormatted}.

If you're still expecting files to be uploaded, make sure they're submitted before this date. After expiration, the upload link will no longer work and any pending uploads will be lost.

Link: ${uploadLink}

Thank you for using FileNest!
      `,
      html: `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <div style="background-color: #3B82F6; padding: 20px; text-align: center;">
    <h1 style="color: white; margin: 0;">FileNest</h1>
  </div>
  <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="margin-top: 0;">Hello,</p>
    
    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
      <p style="margin: 0; color: #B91C1C; font-weight: bold;">⚠️ Expiration Notice</p>
      <p style="margin-top: 5px; margin-bottom: 0;">Your file request "${description}" is set to expire on <strong>${expiryDateFormatted}</strong>.</p>
    </div>
    
    <p>If you're still expecting files to be uploaded, make sure they're submitted before this date. After expiration, the upload link will no longer work and any pending uploads will be lost.</p>
    
    <p style="text-align: center; margin-top: 25px;">
      <a href="${uploadLink}" 
         style="display: inline-block; background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
         View Upload Link
      </a>
    </p>
    
    <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
      <strong>Need more time?</strong> Consider upgrading to our Premium plan to get extended expiry periods.
    </p>
    
    <p style="margin-bottom: 0; color: #6B7280; font-size: 14px; margin-top: 20px;">Thank you for using FileNest!</p>
  </div>
</div>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending expiry notification:', error);
    return false;
  }
};

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
  sendRecipientNotification,
  sendClientConfirmation,
  sendUploadReminder
};