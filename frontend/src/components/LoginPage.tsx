import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth } from '../config/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { loginWithGoogleToken } from '../services/authService';
import { useAppContext } from '../context/AppContext';

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading: contextLoading, loginWithGoogle } = useAppContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [returnUrl, setReturnUrl] = useState<string | null>(null);
  const [authCheckDone, setAuthCheckDone] = useState(false);
  
  useEffect(() => {
    // Get return URL from query params if present
    const params = new URLSearchParams(window.location.search);
    const returnPath = params.get('returnUrl');
    if (returnPath) {
      setReturnUrl(returnPath);
    }
    
    // Mark that we've checked authentication
    setAuthCheckDone(true);
  }, []);
  
  // Handle navigation based on authentication state
  useEffect(() => {
    // Only navigate if we've done the initial auth check and user is authenticated
    // Don't wait for loading states - if user is authenticated, navigate immediately
    if (authCheckDone && isAuthenticated) {
      navigate(returnUrl || '/dashboard', { replace: true });
    }
  }, [authCheckDone, isAuthenticated, navigate, returnUrl]); // Removed loading dependencies
  
  const signInWithGoogle = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Call the improved signInWithGoogle function from context
      const success = await loginWithGoogle();
      
      if (!success) {
        setError('Authentication was cancelled or failed. Please try again.');
        setIsLoading(false);
        return;
      }
      
      // Clear local loading state
      setIsLoading(false);
      // The navigation will happen automatically via the useEffect when auth state updates
      
    } catch (error: any) {
      console.error('Google authentication error:', error);
      
      // Show friendly error message
      if (error.message?.includes('popup')) {
        setError('Authentication popup was blocked. Please allow popups for this website and try again.');
      } else if (error.message?.includes('Cross-Origin-Opener-Policy')) {
        setError('Browser security policy prevented authentication. Please try a different browser or disable enhanced tracking protection.');
      } else {
        setError(error.message || 'Authentication failed. Please try again.');
      }
      
      setIsLoading(false);
    }
  };
  
  // Show loading UI while we check authentication status or waiting for login
  if ((contextLoading && !authCheckDone) || (isLoading && isAuthenticated)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-pulse">
            <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h2 className="mt-6 text-center text-lg sm:text-xl font-medium text-gray-900">
              Checking authentication status...
            </h2>
            <div className="mt-4 flex justify-center">
              <div className="loader ease-linear rounded-full border-4 border-t-4 border-gray-200 h-10 w-10 border-t-primary-500 animate-spin"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            Sign in to FileNest
          </h2>
          <p className="mt-2 text-sm sm:text-base text-gray-600">
            Access your dashboard and manage your file requests
          </p>
        </div>
        
        {/* Benefits of signing in */}
        <div className="bg-white shadow-sm rounded-lg sm:rounded-xl p-4 sm:p-6 border border-gray-100">
          <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 text-sm sm:text-base">Why sign in?</h3>
          <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base">
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="leading-relaxed">Track and manage all your file requests in one place</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="leading-relaxed">Automatically receive file notifications via email</span>
            </li>
            <li className="flex items-start">
              <svg className="h-5 w-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0 mt-0.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="leading-relaxed">Access premium features and increased storage</span>
            </li>
          </ul>
        </div>
        
        {/* Error Message */}
        {error && (
          <div className="rounded-md bg-red-50 p-4 border border-red-100">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
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
        

        
        {/* Sign In Button */}
        <div className="mt-6">
          <button
            onClick={signInWithGoogle}
            disabled={isLoading}
            className="w-full flex justify-center items-center py-3 sm:py-4 px-4 sm:px-6 border border-transparent rounded-lg sm:rounded-xl shadow-sm text-sm sm:text-base font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {isLoading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Signing in...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
                </svg>
                Sign in with Google
              </span>
            )}
          </button>
        </div>
        
        {/* Terms and Privacy */}
        <div className="mt-6 text-center text-xs sm:text-sm text-gray-500">
          By signing in, you agree to our{' '}
          <Link to="/terms" className="font-medium text-gray-600 hover:text-gray-500 transition-colors">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/privacy" className="font-medium text-gray-600 hover:text-gray-500 transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 