import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import stripe from '../config/stripe';

// Export user data (GDPR compliance)
export const exportUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Get user profile data
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) {
      res.status(500).json({ error: 'Failed to fetch user data' });
      return;
    }
    
    // Get user's file requests
    const { data: requests, error: requestsError } = await supabase
      .from('file_requests')
      .select('*, uploaded_files(*)')
      .eq('user_id', userId);
      
    if (requestsError) {
      res.status(500).json({ error: 'Failed to fetch user requests' });
      return;
    }
    
    // Get subscription data
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    // Compile all data
    const exportedData = {
      user: userData,
      requests: requests,
      subscription: subscription || null
    };
    
    res.status(200).json({
      message: 'User data exported successfully',
      data: exportedData
    });
  } catch (error) {
    console.error('Error exporting user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete user account and data (GDPR compliance)
export const deleteUserData = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    
    // Get user data first to check for Stripe customer
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
      
    if (userError) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Cancel any Stripe subscriptions
    if (userData.stripe_customer_id) {
      try {
        // Get subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: userData.stripe_customer_id
        });
        
        // Cancel all active subscriptions
        for (const subscription of subscriptions.data) {
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            await stripe.subscriptions.cancel(subscription.id);
          }
        }
      } catch (stripeError) {
        console.error('Error cancelling Stripe subscriptions:', stripeError);
        // Continue with deletion even if Stripe operations fail
      }
    }
    
    // Delete uploaded files from storage
    try {
      // First get all request IDs for this user
      const { data: userRequests } = await supabase
        .from('file_requests')
        .select('id')
        .eq('user_id', userId);
        
      if (userRequests && userRequests.length > 0) {
        const requestIds = userRequests.map(req => req.id);
        
        // Get all file storage paths for these requests
        const { data: files } = await supabase
          .from('uploaded_files')
          .select('storage_path')
          .in('request_id', requestIds);
          
        // Delete each file from storage
        if (files && files.length > 0) {
          for (const file of files) {
            if (file.storage_path) {
              const { error: storageError } = await supabase
                .storage
                .from('file_uploads')
                .remove([file.storage_path]);
                
              if (storageError) {
                console.error('Error deleting file from storage:', storageError);
              }
            }
          }
        }
      }
    } catch (storageError) {
      console.error('Error in storage cleanup:', storageError);
      // Continue with database deletion
    }
    
    // Delete user's data from database (using cascading deletes)
    const { error: deleteError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);
      
    if (deleteError) {
      res.status(500).json({ error: 'Failed to delete user account' });
      return;
    }
    
    res.status(200).json({ message: 'Account and all associated data deleted successfully' });
  } catch (error) {
    console.error('Error deleting user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 