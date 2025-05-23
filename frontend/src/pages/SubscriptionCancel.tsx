import React from 'react';
import { useNavigate } from 'react-router-dom';

const SubscriptionCancel: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Cancelled</h1>
        <p className="text-gray-600 mb-6">
          You've cancelled the subscription process. No charges have been made.
        </p>
        <div className="space-y-3">
          <button 
            className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => navigate('/subscription')}
          >
            Back to Subscription
          </button>
          <button 
            className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            onClick={() => navigate('/dashboard')}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionCancel; 