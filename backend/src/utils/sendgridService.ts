import sgMail from '@sendgrid/mail';
import dotenv from 'dotenv';
import { UploadedFile } from '../types';

dotenv.config();

// Initialize SendGrid with API key
const apiKey = process.env.SENDGRID_API_KEY;
if (apiKey) {
  sgMail.setApiKey(apiKey);
} else {
  console.warn('SendGrid API key not found. Email notifications will not be sent.');
}

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Send notification email when files are uploaded
 * @param recipientEmail Email of the person who created the request
 * @param description Description of the file request
 * @param files Array of uploaded files
 * @param requestId ID of the file request
 * @returns Success status
 */
export const sendUploadNotification = async (
  recipientEmail: string,
  description: string,
  files: UploadedFile[],
  requestId: string
): Promise<boolean> => {
  try {
    // Skip if SendGrid is not configured
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Email notification skipped.');
      return false;
    }

    // Format frontend URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const dashboardUrl = `${frontendUrl}/dashboard`;
    
    // Format file information for email
    const fileList = files.map(file => ({
      filename: file.filename,
      size: formatFileSize(file.file_size || 0),
      id: file.id
    }));
    
    const totalSize = formatFileSize(
      files.reduce((total, file) => total + (file.file_size || 0), 0)
    );

    // Create email HTML content
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #3B82F6; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">FileNest</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin-top: 0;">Hello,</p>
        <p>Files have been uploaded to your request "<strong>${description}</strong>".</p>
        
        <div style="background-color: #f9fafb; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Files uploaded (${files.length}):</h3>
          <ul style="padding-left: 20px;">
            ${files.map(file => 
              `<li>${file.filename} (${formatFileSize(file.file_size || 0)})</li>`
            ).join('')}
          </ul>
          <p><strong>Total size:</strong> ${totalSize}</p>
        </div>
        
        <p>You can view and download these files from your dashboard:</p>
        <p style="text-align: center;">
          <a href="${dashboardUrl}" 
             style="display: inline-block; background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             Go to Dashboard
          </a>
        </p>
        
        <p style="margin-bottom: 0; color: #6B7280; font-size: 14px; margin-top: 30px;">
          Thank you for using FileNest!
        </p>
      </div>
    </div>
    `;

    // Plain text fallback
    const textContent = `
Files Uploaded - FileNest

Hello,

Files have been uploaded to your request "${description}".

Files uploaded (${files.length}):
${files.map(file => 
  `• ${file.filename} (${formatFileSize(file.file_size || 0)})`
).join('\n')}

Total size: ${totalSize}

You can view and download these files from your dashboard:
${dashboardUrl}

Thank you for using FileNest!
    `;

    // Prepare email data
    const msg = {
      to: recipientEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@filenest.com',
        name: process.env.SENDGRID_FROM_NAME || 'FileNest'
      },
      subject: `Files uploaded: ${description}`,
      text: textContent,
      html: htmlContent
    };

    // Send email
    await sgMail.send(msg);
    console.log(`Upload notification email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending upload notification email:', error);
    return false;
  }
};

/**
 * Send reminder email for pending uploads
 */
export const sendUploadReminder = async (
  recipientEmail: string,
  requestDescription: string,
  deadline: string | null,
  uploadLink: string
): Promise<boolean> => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Skipping reminder.');
      return false;
    }

    const deadlineDate = deadline ? new Date(deadline) : null;
    const deadlineText = deadlineDate 
      ? `The deadline for uploading files is ${deadlineDate.toLocaleDateString()}.`
      : 'Please upload the files at your earliest convenience.';

    // Create HTML email content
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #3B82F6; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">FileNest</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin-top: 0;">Hello,</p>
        <p>This is a reminder about your file request: "<strong>${requestDescription}</strong>".</p>
        
        <div style="background-color: #FEFCE8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #EAB308;">
          <p style="margin: 0; color: #854D0E;"><strong>⏰ Reminder</strong></p>
          <p style="margin-top: 5px; margin-bottom: 0;">${deadlineText}</p>
        </div>
        
        <p>You can share this upload link with anyone who needs to send you files:</p>
        <p style="text-align: center;">
          <a href="${uploadLink}" 
             style="display: inline-block; background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             View Upload Link
          </a>
        </p>
        
        <p style="margin-bottom: 0; color: #6B7280; font-size: 14px; margin-top: 30px;">
          Thank you for using FileNest!
        </p>
      </div>
    </div>
    `;

    // Plain text fallback
    const textContent = `
Reminder: File Request - FileNest

Hello,

This is a reminder about your file request: "${requestDescription}".

${deadlineText}

You can share this upload link with anyone who needs to send you files:
${uploadLink}

Thank you for using FileNest!
    `;

    const msg = {
      to: recipientEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@filenest.com',
        name: process.env.SENDGRID_FROM_NAME || 'FileNest'
      },
      subject: `Reminder: File Request - ${requestDescription}`,
      html: htmlContent,
      text: textContent
    };

    await sgMail.send(msg);
    console.log(`Reminder email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending upload reminder:', error);
    return false;
  }
};

/**
 * Send notification for expiring file requests
 */
export const sendExpiryNotification = async (
  recipientEmail: string,
  description: string,
  expiryDate: string,
  uniqueLink: string
): Promise<boolean> => {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.warn('SendGrid API key not configured. Skipping expiry notification.');
      return false;
    }

    const expiryDateFormatted = new Date(expiryDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const uploadLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/upload/${uniqueLink}`;
    const daysRemaining = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Create HTML email content
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background-color: #3B82F6; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">FileNest</h1>
      </div>
      <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin-top: 0;">Hello,</p>
        
        <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; color: #B91C1C; font-weight: bold;">⚠️ Expiration Notice</p>
          <p style="margin-top: 5px; margin-bottom: 0;">Your file request "${description}" is set to expire on <strong>${expiryDateFormatted}</strong> (${daysRemaining} days remaining).</p>
        </div>
        
        <p>If you're still expecting files to be uploaded, make sure they're submitted before this date. After expiration, the upload link will no longer work.</p>
        
        <p style="text-align: center; margin-top: 25px;">
          <a href="${uploadLink}" 
             style="display: inline-block; background-color: #3B82F6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
             View Upload Link
          </a>
        </p>
        
        <p style="margin-top: 30px; color: #6B7280; font-size: 14px;">
          <strong>Need more time?</strong> Consider upgrading to our Premium plan for extended expiry periods.
        </p>
        
        <p style="margin-bottom: 0; color: #6B7280; font-size: 14px; margin-top: 20px;">Thank you for using FileNest!</p>
      </div>
    </div>
    `;

    // Plain text fallback
    const textContent = `
File Request Expiring Soon - FileNest

Hello,

Your file request "${description}" is set to expire on ${expiryDateFormatted} (${daysRemaining} days remaining).

If you're still expecting files to be uploaded, make sure they're submitted before this date. After expiration, the upload link will no longer work.

Upload link: ${uploadLink}

Need more time? Consider upgrading to our Premium plan for extended expiry periods.

Thank you for using FileNest!
    `;

    const msg = {
      to: recipientEmail,
      from: {
        email: process.env.SENDGRID_FROM_EMAIL || 'noreply@filenest.com',
        name: process.env.SENDGRID_FROM_NAME || 'FileNest'
      },
      subject: `File Request Expiring Soon: ${description}`,
      html: htmlContent,
      text: textContent
    };

    await sgMail.send(msg);
    console.log(`Expiry notification email sent to ${recipientEmail}`);
    return true;
  } catch (error) {
    console.error('Error sending expiry notification:', error);
    return false;
  }
};

export default {
  sendUploadNotification,
  sendUploadReminder,
  sendExpiryNotification
}; 