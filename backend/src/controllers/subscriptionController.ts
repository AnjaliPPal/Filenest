import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import stripe, { STRIPE_PRICES } from '../config/stripe';
import { SubscriptionTier, SubscriptionLimits, SubscriptionPlan } from '../types/subscription';
import dotenv from 'dotenv';

dotenv.config();

// Get subscription limits based on tier
export function getSubscriptionLimits(tier: SubscriptionTier): SubscriptionLimits {
  switch (tier) {
    case SubscriptionTier.PREMIUM:
      return {
        maxStorageMB: 1000, // 1 GB
        maxFileSizeMB: 100, // 100 MB per file
        maxUploadFiles: 100, // 100 files per request
        maxRequestsPerMonth: 100,
        allowsTeamAccess: true,
        allowsAdvancedAnalytics: true,
        expiryDays: 30 // 30 days for premium tier
      };
    case SubscriptionTier.FREE:
    default:
      return {
        maxStorageMB: 100, // 100 MB total
        maxFileSizeMB: 10, // 10 MB per file
        maxUploadFiles: 5, // 5 files per request
        maxRequestsPerMonth: 10, 
        allowsTeamAccess: false,
        allowsAdvancedAnalytics: false,
        expiryDays: 7 // 7 days for free tier
      };
  }
}

// Get subscription plans
export const getSubscriptionPlans = async (req: Request, res: Response): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('is_active', true)
      .order('price_monthly', { ascending: true });

    if (error) {
      res.status(500).json({ error: 'Failed to fetch subscription plans' });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get user's current subscription
export const getUserSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get user ID from authenticated session
    const userId = req.user?.userId;
    
    if (!userId) {
      // Return a default free tier for unauthenticated users
      res.status(200).json({
        id: null,
        user_id: null,
        tier: SubscriptionTier.FREE,
        is_active: true,
        start_date: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        limits: getSubscriptionLimits(SubscriptionTier.FREE)
      });
      return;
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no subscription found, return a default free tier
      if (error.code === 'PGRST116') {
        res.status(200).json({
          id: null,
          user_id: userId,
          tier: SubscriptionTier.FREE,
          is_active: true,
          start_date: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          limits: getSubscriptionLimits(SubscriptionTier.FREE)
        });
        return;
      }
      
      res.status(500).json({ error: 'Failed to fetch subscription' });
      return;
    }

    // Add limits to the response based on the subscription tier
    const subscriptionWithLimits = {
      ...data,
      limits: getSubscriptionLimits(data.tier)
    };

    res.status(200).json(subscriptionWithLimits);
  } catch (error) {
    console.error('Get user subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create checkout session for subscription
export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const { priceId, userId, email } = req.body;
    
    if (!priceId || !userId || !email) {
      res.status(400).json({ error: 'Price ID, user ID, and email are required' });
      return;
    }

    // TODO: Create Stripe checkout session
    // This would typically call Stripe's API to create a checkout session
    // For now, we'll just return a mock response

    res.status(200).json({
      sessionId: 'mock_session_id',
      url: 'https://example.com/checkout'
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Cancel subscription
export const cancelSubscription = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user?.userId;
    
    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Get current subscription
    const { data: subscription, error: subscriptionError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subscriptionError || !subscription) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    // TODO: Cancel subscription with Stripe if it exists
    // For now, just mark as inactive in database

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        is_active: false,
        end_date: new Date().toISOString()
      })
      .eq('id', subscription.id);

    if (updateError) {
      res.status(500).json({ error: 'Failed to cancel subscription' });
      return;
    }

    res.status(200).json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Handle Stripe webhook events
export const handleStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig) {
    res.status(400).json({ error: 'Missing Stripe signature' });
    return;
  }

  try {
    // Verify webhook signature
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    // Handle specific events
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any;
        const { userId } = session.metadata;
        
        // Update user subscription in database
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_subscription_id: session.subscription,
            tier: SubscriptionTier.PREMIUM,
            is_active: true,
            start_date: new Date().toISOString()
          });

        // Update user tier
        await supabase
          .from('users')
          .update({ subscription_tier: SubscriptionTier.PREMIUM })
          .eq('id', userId);
        
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        
        // Get userId from stripe customer
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();
          
        if (userData) {
          // Update subscription status
          await supabase
            .from('subscriptions')
            .update({
              is_active: subscription.status === 'active',
              end_date: subscription.cancel_at ? new Date(subscription.cancel_at * 1000).toISOString() : null
            })
            .eq('stripe_subscription_id', subscription.id);
        }
        
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer;
        
        // Get userId from stripe customer
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single();
        
        if (userData) {
          // Deactivate subscription
          await supabase
            .from('subscriptions')
            .update({
              is_active: false,
              tier: SubscriptionTier.FREE,
              end_date: new Date().toISOString()
            })
            .eq('stripe_subscription_id', subscription.id);
          
          // Update user tier
          await supabase
            .from('users')
            .update({ subscription_tier: SubscriptionTier.FREE })
            .eq('id', userData.id);
        }
          
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Error handling webhook:', error);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
}; 