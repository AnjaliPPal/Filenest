import express from 'express';
import {
  getSubscriptionPlans,
  getUserSubscription,
  createCheckoutSession,
  cancelSubscription,
  handleStripeWebhook
} from '../controllers/subscriptionController';
import { authMiddleware } from '../middlewares/authMiddleware';

const router = express.Router();

// Get subscription plans (no auth required)
router.get('/plans', getSubscriptionPlans);

// User subscription operations (auth required)
router.get('/my-subscription', authMiddleware.optionalAuth, getUserSubscription);
router.post('/create-checkout', createCheckoutSession);
router.post('/cancel', authMiddleware.authenticate, cancelSubscription);

// Stripe webhook (no auth, raw body)
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

export default router; 