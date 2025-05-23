import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const SubscriptionSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAppContext();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (!sessionId) {
      setError('Invalid session. Please try again.');
      setIsLoading(false);
      return;
    }

    // In a real app, you might want to verify the session with your backend
    // For now, we'll just redirect to the dashboard after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [searchParams, navigate]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-lg text-gray-600">Activating your subscription...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
        <button 
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => navigate('/subscription')}
        >
          Back to Subscription
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Subscription Activated!</h1>
        <p className="text-gray-600 mb-6">
          Thank you for upgrading to Premium. Your subscription has been successfully activated.
        </p>
        <button 
          className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => navigate('/dashboard')}
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  );
};

export default SubscriptionSuccess; 