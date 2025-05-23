import { Request, Response } from 'express';


import { supabase } from '../config/supabase';
import { CreateRequestInput } from '../types';
import { sendUploadNotification } from '../utils/emailService';
import { nanoid } from 'nanoid';
import { SubscriptionTier } from '../types/subscription';
import { getSubscriptionLimits } from './subscriptionController';
import { logger } from '../utils/logger';

// Create a new file request
export const createRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recipientEmail, description, deadline, expiry_days = 7 }: CreateRequestInput = req.body;

    if (!recipientEmail || !description) {
      res.status(400).json({ error: 'Recipient email and description are required' });
      return;
    }

    // Default to FREE tier if not authenticated
    let tier = SubscriptionTier.FREE;
    
    // First, try to get or create a user account for the request owner
    let userId = req.user?.userId;
    
    // If we don't have a user ID from authentication, look up or create by email
    if (!userId && recipientEmail) {
      try {
        // Check if a user with this email already exists
        const { data: existingUser, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('email', recipientEmail)
          .single();
          
        if (userError || !existingUser) {
          // Create a new user with this email
          logger.info(`Creating new user for email: ${recipientEmail}`);
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              email: recipientEmail
            })
            .select('id')
            .single();
            
          if (createError) {
            logger.error(`Failed to create user for ${recipientEmail}:`, createError);
          } else if (newUser) {
            userId = newUser.id;
            logger.info(`Created new user with ID: ${userId}`);
          }
        } else {
          userId = existingUser.id;
          logger.info(`Found existing user with ID: ${userId}`);
        }
      } catch (userLookupError) {
        logger.error('Error in user lookup/creation:', userLookupError);
      }
    }
    
    // If user is authenticated or created, fetch subscription tier
    if (userId) {
      const { data: subscription, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', userId)
        .single();
        
      if (!subscriptionError && subscription) {
        tier = subscription.tier;
      }
    }
    
    const limits = getSubscriptionLimits(tier);
    
    // Get the count of active requests for this user
    let activeCount = 0;
    if (userId) {
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      const { count, error: countError } = await supabase
        .from('file_requests')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', firstDayOfMonth.toISOString());
      
      if (countError) {
        logger.error('Error counting active requests:', countError);
        res.status(500).json({ error: 'Failed to check request limits' });
        return;
      }
      
      if (count !== null) {
        activeCount = count;
      }
      
      // Check if user has reached their request limit
      if (activeCount >= limits.maxRequestsPerMonth) {
        res.status(403).json({
          error: 'You have reached your monthly request limit',
          limit: limits.maxRequestsPerMonth,
          current: activeCount,
          tier,
          upgradeRequired: tier === SubscriptionTier.FREE
        });
        return;
      }
    }
    
    // Calculate expiry date based on subscription
    const expiryDays = (tier === SubscriptionTier.PREMIUM) ? 30 : 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + expiryDays);
    
    // Generate a unique link
    const uniqueLink = nanoid(10);
    
    try {
      // Create the request in the database
      const { data: request, error } = await supabase
        .from('file_requests')
        .insert({
          user_id: userId, // Use the determined userId (which might be null only if user creation failed)
          recipient_email: recipientEmail,
          description,
          deadline: deadline || null,
          unique_link: uniqueLink,
          status: 'pending',
          expires_at: expiryDate.toISOString(),
          is_active: true
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating request:', error);
        res.status(500).json({ error: 'Failed to create file request' });
        return;
      }

      // Send email notification to recipient
      if (recipientEmail) {
        try {
          await sendUploadNotification(
            recipientEmail,
            description,
            [], // No files yet
            request.id
          );
        } catch (emailError) {
          logger.error('Failed to send email notification:', emailError);
          // Continue even if email fails
        }
      }

      res.status(201).json({
        request,
        limits: {
          activeLimit: limits.maxRequestsPerMonth,
          currentActive: activeCount || 0,
          expiryDays: expiryDays,
          tier
        }
      });
    } catch (error) {
      logger.error('Error creating request:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } catch (error) {
    logger.error('Create request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get file request by unique link
export const getRequestByLink = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Get request by link:', req.params);
    const { link } = req.params;

    if (!link) {
      res.status(400).json({ error: 'Link is required' });
      return;
    }

    // Get request by unique link
    const { data: request, error: requestError } = await supabase
      .from('file_requests')
      .select('*, users!file_requests_user_id_fkey(id, email)')
      .eq('unique_link', link)
      .eq('is_active', true)
      .single();

    console.log('Request lookup result:', { request, requestError });

    if (requestError || !request) {
      res.status(404).json({ error: 'File request not found or expired' });
      return;
    }

    if (new Date(request.expires_at) < new Date()) {
      res.status(400).json({ error: 'This file request has expired' });
      return;
    }

    // Get tier if user exists
    let tier = SubscriptionTier.FREE;
    if (request.user_id) {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier')
        .eq('user_id', request.user_id)
        .single();
        
      if (subscription) {
        tier = subscription.tier;
      }
    }

    res.status(200).json({
      id: request.id,
      description: request.description,
      deadline: request.deadline,
      status: request.status,
      expires_at: request.expires_at,
      is_active: request.is_active,
      tier: tier
    });
  } catch (error) {
    console.error('Get request error:', error);
    res.status(500).json({ error: 'Internal server error: ' + (error instanceof Error ? error.message : String(error)) });
  }
};

// Get all requests for a user
export const getUserRequests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.params;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Get user ID from email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Get user's subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();

    // Default to FREE tier if no subscription found
    const tier = subscription?.tier || SubscriptionTier.FREE;
    const limits = getSubscriptionLimits(tier);

    // Get user's file requests with related uploaded files
    const { data: requests, error: requestsError } = await supabase
      .from('file_requests')
      .select(`
        *,
        uploaded_files (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (requestsError) {
      res.status(500).json({ error: 'Failed to fetch file requests' });
      return;
    }

    // Make sure the response is an array
    const requestsArray = Array.isArray(requests) ? requests : [];

    res.status(200).json({
      requests: requestsArray,
      subscription: {
        tier,
        activeLimit: limits.maxRequestsPerMonth,
        storageLimit: limits.maxStorageMB,
        expiryDays: tier === SubscriptionTier.PREMIUM ? 30 : 7,
        maxFileSize: limits.maxFileSizeMB
      }
    });
  } catch (error) {
    console.error('Get user requests error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a file request
export const updateRequest = async (req: Request, res: Response): Promise<void> => {
  try {
    const { requestId } = req.params;
    const { description, deadline, is_active } = req.body;
    
    if (!requestId) {
      res.status(400).json({ error: 'Request ID is required' });
      return;
    }
    
    // Check if user owns this request
    const { data: request, error: requestError } = await supabase
      .from('file_requests')
      .select('*')
      .eq('id', requestId)
      .eq('user_id', req.user?.userId)
      .single();
      
    if (requestError || !request) {
      res.status(404).json({ error: 'File request not found or you do not have permission to update it' });
      return;
    }
    
    // Update only provided fields
    const updateData: any = {};
    if (description !== undefined) updateData.description = description;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ error: 'No fields to update provided' });
      return;
    }
    
    // Update the request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('file_requests')
      .update(updateData)
      .eq('id', requestId)
      .select()
      .single();
      
    if (updateError) {
      console.error('Error updating request:', updateError);
      res.status(500).json({ error: 'Failed to update file request' });
      return;
    }
    
    res.status(200).json({
      message: 'File request updated successfully',
      request: updatedRequest
    });
  } catch (error) {
    console.error('Update request error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
