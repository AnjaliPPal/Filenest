import sgMail from '@sendgrid/mail';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { logger } from './logger';
import { UploadedFile } from '../types';

dotenv.config();

// Initialize SendGrid
const sendgridApiKey = process.env.SENDGRID_API_KEY;
if (sendgridApiKey) {
  sgMail.setApiKey(sendgridApiKey);
  logger.info('SendGrid initialized with API key');
} else {
  logger.warn('SendGrid API key not configured - email delivery will be limited');
}

// Initialize nodemailer as backup
let transporter: nodemailer.Transporter | null = null;
try {
  if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: parseInt(process.env.EMAIL_PORT || '587', 10),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      }
    });
    logger.info('Nodemailer fallback initialized');
  }
} catch (error) {
  logger.error('Failed to initialize nodemailer:', error);
}

// Helper to format file sizes
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Add whitelist message to email content
const addWhitelistMessage = (html: string): string => {
  const whitelistMsg = `
  <div style="background-color: #f8f9fa; padding: 10px; margin-bottom: 15px; border-left: 4px solid #6c757d; font-size: 14px;">
    <p style="margin: 0;">⚠️ <strong>Important:</strong> To ensure you receive our emails, please add <strong>hellofilenest@gmail.com</strong> to your contacts.</p>
  </div>`;
  
  // Find the opening div of the content area to insert after
  const contentDivPos = html.indexOf('<div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">');
  if (contentDivPos !== -1) {
    // Find position after the opening div tag and the first child element (usually a <p>)
    const insertPos = html.indexOf('<p', contentDivPos);
    if (insertPos !== -1) {
      return html.slice(0, insertPos) + whitelistMsg + html.slice(insertPos);
    }
  }
  return html; // If we can't find the position, return original
};

/**
 * Send an email using SendGrid (preferred) or nodemailer (fallback)
 */
const sendEmail = async (options: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> => {
  try {
    // Add [FileNest] prefix to subject
    const prefixedSubject = `[FileNest] ${options.subject}`;
    
    // Try SendGrid first
    if (sendgridApiKey) {
      logger.info(`Sending email to ${options.to} via SendGrid`);
      
      // Add whitelist message to HTML content
      const enhancedHtml = addWhitelistMessage(options.html);
      
      await sgMail.send({
        to: options.to,
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'hellofilenest@gmail.com',
          name: process.env.SENDGRID_FROM_NAME || 'FileNest'
        },
        subject: prefixedSubject,
        html: enhancedHtml,
        text: `⚠️ IMPORTANT: Please add hellofilenest@gmail.com to your contacts to ensure delivery.\n\n${options.text}`
      });
      
      logger.info(`Email sent via SendGrid to ${options.to}`);
      return true;
    }
    
    // Fall back to nodemailer if SendGrid not configured
    if (transporter) {
      logger.info(`Sending email to ${options.to} via Nodemailer`);
      
      // Add whitelist message to HTML content
      const enhancedHtml = addWhitelistMessage(options.html);
      
      await transporter.sendMail({
        from: `"FileNest" <${process.env.EMAIL_FROM || 'hellofilenest@gmail.com'}>`,
        to: options.to,
        subject: prefixedSubject,
        html: enhancedHtml,
        text: `⚠️ IMPORTANT: Please add hellofilenest@gmail.com to your contacts to ensure delivery.\n\n${options.text}`
      });
      
      logger.info(`Email sent via Nodemailer to ${options.to}`);
      return true;
    }
    
    // No email method available
    logger.warn('No email service configured, skipping email');
    return false;
  } catch (error) {
    logger.error('Error sending email:', error);
    return false;
  }
};

/**
 * Send notification email when files are uploaded
 */
export const sendUploadNotification = async (
  recipientEmail: string,
  description: string,
  files: UploadedFile[],
  requestId: string
): Promise<boolean> => {
  try {
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

    return await sendEmail({
      to: recipientEmail,
      subject: `Files uploaded: ${description}`,
      html: htmlContent,
      text: textContent
    });

  } catch (error) {
    logger.error('Error sending upload notification email:', error);
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

    return await sendEmail({
      to: recipientEmail,
      subject: `Reminder: File Request - ${requestDescription}`,
      html: htmlContent,
      text: textContent
    });
  } catch (error) {
    logger.error('Error sending upload reminder:', error);
    return false;
  }
}; 