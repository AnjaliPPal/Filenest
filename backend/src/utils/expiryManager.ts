import { supabase } from '../config/supabase';
import { SubscriptionTier } from '../types/subscription';
import { getSubscriptionLimits } from '../controllers/subscriptionController';
import { sendExpiryNotification } from './email';
import dotenv from 'dotenv';

dotenv.config();

// Check for and handle expired requests
export const handleExpiredRequests = async (): Promise<void> => {
  try {
    console.log('Checking for expired requests...');
    
    // First get all active requests with their user data
    const { data: requests, error } = await supabase
      .from('file_requests')
      .select(`
        *,
        users!inner(
          id, 
          email
        )
      `)
      .eq('is_active', true);
      
    if (error) {
      throw error;
    }
    
    if (!requests || requests.length === 0) {
      console.log('No active requests found');
      return;
    }
    
    // For each request, get the subscription data for the user if they have one
    const now = new Date();
    const expiredRequestIds: string[] = [];
    const expiringRequestIds: string[] = [];
    
    for (const request of requests) {
      // Default to FREE tier
      let tier = SubscriptionTier.FREE;
      
      // If user_id exists, try to get their subscription tier
      if (request.user_id) {
        const { data: subscriptionData } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', request.user_id)
          .eq('is_active', true)
          .single();
        
        if (subscriptionData) {
          tier = subscriptionData.tier;
        }
      }
      
      const createdAt = new Date(request.created_at);
      const limits = getSubscriptionLimits(tier);
      
      // Calculate expiry date based on subscription tier
      const expiryDate = new Date(createdAt);
      expiryDate.setDate(expiryDate.getDate() + limits.expiryDays);
      
      // Check if request has expired
      if (now > expiryDate) {
        expiredRequestIds.push(request.id);
      } 
      // Check if request will expire within the next day
      else if (now > new Date(expiryDate.getTime() - 24 * 60 * 60 * 1000)) {
        expiringRequestIds.push(request.id);
        
        // Send expiry notification to user
        try {
          await sendExpiryNotification({
            email: request.users.email,
            description: request.description,
            expiryDate: expiryDate.toISOString(),
            unique_link: request.unique_link
          });
          console.log(`Sent expiry notification for request ${request.id} to ${request.users.email}`);
        } catch (emailError) {
          console.error(`Failed to send expiry notification for request ${request.id}:`, emailError);
        }
      }
    }
    
    if (expiredRequestIds.length > 0) {
      console.log(`Found ${expiredRequestIds.length} expired requests`);
      
      // Mark requests as inactive
      const { error: updateError } = await supabase
        .from('file_requests')
        .update({ is_active: false })
        .in('id', expiredRequestIds);
        
      if (updateError) {
        throw updateError;
      }
      
      console.log(`Marked ${expiredRequestIds.length} requests as expired`);
    } else {
      console.log('No expired requests found');
    }
    
    if (expiringRequestIds.length > 0) {
      console.log(`Sent notifications for ${expiringRequestIds.length} requests expiring soon`);
    }
  } catch (error) {
    console.error('Error handling expired requests:', error);
  }
};

// Schedule regular checks for expired requests
export const initializeExpiryManager = (intervalHours: number = 24): void => {
  const intervalMs = intervalHours * 60 * 60 * 1000;
  
  console.log(`Initializing request expiry manager with ${intervalHours} hour interval`);
  
  // Run immediately on startup
  handleExpiredRequests();
  
  // Then schedule regular checks
  setInterval(handleExpiredRequests, intervalMs);
}; 