import { SubscriptionTier } from './subscription';

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        subscription_tier?: SubscriptionTier;
      };
    }
  }
} 