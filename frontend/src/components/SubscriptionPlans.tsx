import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SubscriptionTier } from '../types';

const SubscriptionPlans: React.FC = () => {
  const { createCheckout, userSubscription } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async (priceId: string) => {
    try {
      setIsLoading(true);
      const result = await createCheckout(priceId);
      if (result && result.url) {
        window.location.href = result.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      alert('Failed to create checkout session. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const isFreeTier = !userSubscription || userSubscription.tier === SubscriptionTier.FREE;
  const isPremium = userSubscription && userSubscription.tier === SubscriptionTier.PREMIUM;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <h2 className="text-2xl font-bold text-center mb-8">Choose Your Plan</h2>
      
      <div className="grid md:grid-cols-2 gap-8">
        {/* Free Plan */}
        <div className={`border rounded-lg p-6 shadow-sm ${!isFreeTier ? 'opacity-70' : ''}`}>
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-semibold mb-2">Free Plan</h3>
              <p className="text-gray-600 mb-4">Basic file sharing for individuals</p>
            </div>
            {isFreeTier && (
              <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">Current Plan</span>
            )}
          </div>
          
          <ul className="space-y-2 my-6">
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              1 active file request
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              100MB storage
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              7-day link expiry
            </li>
          </ul>
          
          <div className="mt-4">
            <p className="text-3xl font-bold">$0</p>
            <p className="text-sm text-gray-500">Free forever</p>
          </div>
          
          <button 
            className="w-full mt-6 py-2 px-4 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50"
            disabled={true}
          >
            Current Plan
          </button>
        </div>
        
        {/* Premium Plan */}
        <div className={`border-2 ${isPremium ? 'border-green-500' : 'border-blue-500'} rounded-lg p-6 shadow-lg relative`}>
          {isPremium ? (
            <div className="absolute -top-3 -right-3">
              <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">Active</span>
            </div>
          ) : (
            <div className="absolute -top-3 -right-3">
              <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">Recommended</span>
            </div>
          )}
          
          <div>
            <h3 className="text-xl font-semibold mb-2">Premium Plan</h3>
            <p className="text-gray-600 mb-4">Advanced features for professionals</p>
          </div>
          
          <ul className="space-y-2 my-6">
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              <strong>Unlimited</strong> active file requests
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              1GB storage
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              30-day link expiry
            </li>
            <li className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
              </svg>
              Priority support
            </li>
          </ul>
          
          <div className="mt-4">
            <p className="text-3xl font-bold">$9.99<span className="text-sm font-normal text-gray-500">/month</span></p>
            <p className="text-sm text-blue-600">Save 16% with annual billing</p>
          </div>
          
          {isPremium ? (
            <button 
              className="w-full mt-6 py-2 px-4 bg-green-500 text-white rounded hover:bg-green-600"
              onClick={() => window.location.href = '/account/billing'}
              disabled={isLoading}
            >
              Manage Subscription
            </button>
          ) : (
            <button 
              className="w-full mt-6 py-2 px-4 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => handleUpgrade('price_premium_monthly')}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Upgrade Now'}
            </button>
          )}
          
          {!isPremium && (
            <button 
              className="w-full mt-3 py-2 px-4 border border-blue-500 text-blue-500 rounded hover:bg-blue-50"
              onClick={() => handleUpgrade('price_premium_yearly')}
              disabled={isLoading}
            >
              {isLoading ? 'Processing...' : 'Get Annual Plan (Save 16%)'}
            </button>
          )}
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg mt-10">
        <h3 className="text-lg font-semibold mb-3">All plans include:</h3>
        <ul className="grid md:grid-cols-3 gap-3">
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Secure file sharing
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            End-to-end encryption
          </li>
          <li className="flex items-center">
            <svg className="w-4 h-4 mr-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            GDPR compliant
          </li>
        </ul>
      </div>
    </div>
  );
};

export default SubscriptionPlans; 