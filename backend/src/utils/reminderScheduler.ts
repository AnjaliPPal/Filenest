/**
 * Scheduler for sending reminders for pending uploads
 */
import { supabase } from '../config/supabase';
import { sendUploadReminder } from './emailService';
import { logger } from './logger';

/**
 * Send reminders for pending file uploads
 * - For requests with a deadline within 48 hours
 * - For requests that haven't been completed yet
 */
export const sendPendingUploadReminders = async (): Promise<void> => {
  try {
    logger.info('Starting scheduled reminder check');
    
    const now = new Date();
    
    // Calculate date 48 hours from now for deadline check
    const deadlineThreshold = new Date();
    deadlineThreshold.setHours(deadlineThreshold.getHours() + 48);
    
    // Find pending requests that:
    // 1. Are still active
    // 2. Haven't expired yet
    // 3. Haven't been completed yet
    // 4. Have a deadline within the next 48 hours or no deadline
    const { data: pendingRequests, error } = await supabase
      .from('file_requests')
      .select('*, users(email)')
      .eq('status', 'pending')
      .eq('is_active', true)
      .filter('expires_at', 'gt', now.toISOString())
      .or(`deadline.lt.${deadlineThreshold.toISOString()},deadline.is.null`);
    
    if (error) {
      logger.error('Error fetching pending requests:', error);
      return;
    }
    
    logger.info(`Found ${pendingRequests?.length || 0} pending requests that need reminders`);
    
    // Send reminders for each pending request
    if (pendingRequests) {
      for (const request of pendingRequests) {
        try {
          // Get the client email (could be stored in a separate field or fetched from another table)
          // In this case, assuming client_email field exists, otherwise fall back to creator's email
          const clientEmail = request.recipient_email || request.users?.email;
          
          if (!clientEmail) {
            logger.warn(`No recipient email found for request ${request.id}`);
            continue;
          }
          
          // Generate the upload link
          const uploadLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/upload/${request.unique_link}`;
          
          // Send the reminder
          const sent = await sendUploadReminder(
            clientEmail,
            request.description,
            request.deadline,
            uploadLink
          );
          
          if (sent) {
            logger.info(`Sent reminder for request "${request.description}" to ${clientEmail}`);
            
            // Update last_reminder_sent field if you're tracking reminders
            await supabase
              .from('file_requests')
              .update({ last_reminder_sent: new Date().toISOString() })
              .eq('id', request.id);
          } else {
            logger.warn(`Failed to send reminder to ${clientEmail}`);
          }
          
        } catch (requestError) {
          logger.error(`Error sending reminder for request ${request.id}:`, requestError);
          // Continue with next request even if one fails
        }
      }
    }
    
    logger.info('Completed sending reminders');
  } catch (error) {
    logger.error('Error in reminder scheduler:', error);
  }
};

/**
 * Initialize scheduler to run periodically
 * @param intervalHours How often to check for pending uploads that need reminders
 */
export const initializeReminderScheduler = (intervalHours = 12): NodeJS.Timeout => {
  logger.info(`Initializing reminder scheduler to run every ${intervalHours} hours`);
  
  // Run once at startup
  setTimeout(() => {
    sendPendingUploadReminders().catch(err => {
      logger.error('Error in initial reminder check:', err);
    });
  }, 60 * 1000); // Wait 1 minute after startup before first run
  
  // Then schedule regular checks
  return setInterval(() => {
    sendPendingUploadReminders().catch(err => {
      logger.error('Error in scheduled reminder:', err);
    });
  }, intervalHours * 60 * 60 * 1000);
};

export default {
  sendPendingUploadReminders,
  initializeReminderScheduler
}; 