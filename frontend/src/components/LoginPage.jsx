import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  useEffect(() => {
    // Check if already logged in
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    if (token && userData) {
      console.log('User already logged in, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [navigate]);
  
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Use popup for most reliable authentication experience
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      if (!user) {
        throw new Error('Failed to authenticate with Google');
      }
      
      console.log('Google authentication successful');
      
      // Get the user's ID token
      const idToken = await user.getIdToken();
      
      // Store essential auth data in localStorage
      const userData = {
        id: user.uid,
        email: user.email,
        name: user.displayName || 'User'
      };
      
      localStorage.setItem('auth_token', idToken);
      localStorage.setItem('user_data', JSON.stringify(userData));
      localStorage.setItem('auth_expiry', (Date.now() + 24 * 60 * 60 * 1000).toString());
      
      console.log('Authentication data stored, redirecting to dashboard');
      
      // Force navigation to dashboard
      navigate('/dashboard', { replace: true });
    } catch (error) {
      console.error('Google authentication error:', error);
      setError('Authentication failed. Please try again.');
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to FileNest
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <button 
              onClick={() => navigate('/')} 
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              use the app without an account
            </button>
          </p>
        </div>
        
        {error && (
          <div className="rounded-md bg-red-50 p-4 mb-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  Error
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <div className="mt-8">
          <button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {isLoading ? 'Signing in...' : 'Sign in with Google'}
          </button>
        </div>
        
        <div className="mt-6 text-center text-sm text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 