export enum SubscriptionTier {
  FREE = 'free',
  PREMIUM = 'premium'
}

export interface SubscriptionLimits {
  maxStorageMB: number;
  maxFileSizeMB: number;
  maxUploadFiles: number;
  maxRequestsPerMonth: number;
  allowsTeamAccess: boolean;
  allowsAdvancedAnalytics: boolean;
  expiryDays: number; // Number of days before a request expires
}

export interface Subscription {
  id: string;
  user_id: string;
  tier: SubscriptionTier;
  is_active: boolean;
  start_date: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  priceMonthly?: number;
  priceYearly?: number;
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
}

export interface StripeCheckoutRequest {
  priceId: string;
  userId: string;
  email: string;
}

export interface StripeCheckoutResponse {
  sessionId: string;
  url: string;
}

export interface UserSubscriptionData {
  tier: SubscriptionTier;
  isActive: boolean;
  expiresAt?: string;
  limits: SubscriptionLimits;
} 