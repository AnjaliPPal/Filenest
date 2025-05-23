import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import { getSubscriptionLimits } from './subscriptionController';
import { SubscriptionTier } from '../types/subscription';

/**
 * Get dashboard data for a user
 * - Gets user file requests with uploaded files
 * - Gets user subscription information
 */
export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      res.status(400).json({ error: 'User ID is required' });
      return;
    }

    logger.info(`Fetching dashboard data for user: ${userId}`);
    
    const dashboardData = await fetchDashboardData(userId);
    
    res.status(200).json(dashboardData);
  } catch (error: any) {
    logger.error(`Dashboard fetch error for user ${req.params.userId}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Get dashboard data for a user by email
 */
export const getDashboardByEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;
    
    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    logger.info(`Fetching dashboard data for email: ${email}`);
    
    // Get user ID from email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      // Instead of failing, look for requests with matching recipient_email even if no user found
      logger.warn(`User not found for email ${email}, looking for requests with matching recipient_email`);
      const dashboardData = await fetchDashboardDataByEmail(email);
      res.status(200).json(dashboardData);
      return;
    }
    
    const dashboardData = await fetchDashboardData(user.id);
    
    res.status(200).json(dashboardData);
  } catch (error: any) {
    logger.error(`Dashboard fetch error for email ${req.params.email}:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Fetch dashboard data by recipient email (fallback if no user found)
 */
async function fetchDashboardDataByEmail(email: string): Promise<{ requests: any[], subscription?: any }> {
  // Get requests where recipient_email matches, even if user_id is null
  const { data: requests, error: requestsError } = await supabase
    .from('file_requests')
    .select(`
      id, description, unique_link, status, expires_at, created_at, 
      updated_at, is_active, deadline, recipient_email,
      uploaded_files (id, filename, storage_path, content_type, file_size, uploaded_at)
    `)
    .eq('recipient_email', email)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (requestsError) {
    logger.error(`Failed to fetch file requests for email ${email}:`, requestsError);
    throw new Error('Failed to fetch file requests');
  }

  // Default to FREE tier
  const tier = SubscriptionTier.FREE;
  const limits = getSubscriptionLimits(tier);

  // Make sure the response is an array
  const requestsArray = Array.isArray(requests) ? requests : [];

  return {
    requests: requestsArray,
    subscription: {
      tier,
      activeLimit: limits.maxRequestsPerMonth,
      storageLimit: limits.maxStorageMB,
      expiryDays: 7,
      maxFileSize: limits.maxFileSizeMB
    }
  };
}

/**
 * Core function to fetch dashboard data
 * Uses transaction to ensure consistency of data
 */
async function fetchDashboardData(userId: string): Promise<{ requests: any[], subscription?: any }> {
  try {
    const { data, error } = await supabase.rpc('get_dashboard_data', { user_id_param: userId });
    
    if (error) throw error;
    
    const requests = data || [];
    return { requests };
  } catch (error: any) {
    logger.error(`RPC get_dashboard_data failed, using fallback query: ${error.message}`);
    
    // Fallback if RPC fails
    return fetchDashboardDataFallback(userId);
  }
}

/**
 * Fallback function to fetch dashboard data using standard queries
 * Only used if the RPC method fails
 */
async function fetchDashboardDataFallback(userId: string): Promise<{ requests: any[], subscription?: any }> {
  // Get user's subscription info
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('tier')
    .eq('user_id', userId)
    .single();

  // Default to FREE tier if no subscription found
  const tier = subscription?.tier || SubscriptionTier.FREE;
  const limits = getSubscriptionLimits(tier);

  // Get user email for checking orphaned requests too
  const { data: user } = await supabase
    .from('users')
    .select('email')
    .eq('id', userId)
    .single();
    
  const userEmail = user?.email;

  // Get user's file requests with related uploaded files
  // This uses a recursive CTE query for better performance
  const { data: requests, error: requestsError } = await supabase
    .from('file_requests')
    .select(`
      id, description, unique_link, status, expires_at, created_at, 
      updated_at, is_active, deadline, recipient_email,
      uploaded_files (id, filename, storage_path, content_type, file_size, uploaded_at)
    `)
    .eq('user_id', userId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (requestsError) {
    logger.error(`Failed to fetch file requests for user ${userId}:`, requestsError);
    throw new Error('Failed to fetch file requests');
  }
  
  // Also check for requests where recipient_email matches but user_id might be null
  let combinedRequests = requests || [];

  if (userEmail) {
    try {
      const { data: orphanedRequests, error: orphanedError } = await supabase
        .from('file_requests')
        .select(`
          id, description, unique_link, status, expires_at, created_at, 
          updated_at, is_active, deadline, recipient_email,
          uploaded_files (id, filename, storage_path, content_type, file_size, uploaded_at)
        `)
        .is('user_id', null)
        .eq('recipient_email', userEmail)
        .is('deleted_at', null)
        .order('created_at', { ascending: false });
        
      if (!orphanedError && orphanedRequests && orphanedRequests.length > 0) {
        logger.info(`Found ${orphanedRequests.length} orphaned requests for email ${userEmail}`);
        // Combine the requests, avoiding duplicates
        const existingIds = new Set(combinedRequests.map(r => r.id));
        const uniqueOrphaned = orphanedRequests.filter(r => !existingIds.has(r.id));
        combinedRequests = [...combinedRequests, ...uniqueOrphaned];
      }
    } catch (error) {
      logger.error(`Error finding orphaned requests for ${userEmail}:`, error);
    }
  }

  // Make sure the response is an array
  const requestsArray = Array.isArray(combinedRequests) ? combinedRequests : [];

  return {
    requests: requestsArray,
    subscription: {
      tier,
      activeLimit: limits.maxRequestsPerMonth,
      storageLimit: limits.maxStorageMB,
      expiryDays: tier === SubscriptionTier.PREMIUM ? 30 : 7,
      maxFileSize: limits.maxFileSizeMB
    }
  };
} 