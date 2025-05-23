import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { auth } from '../config/firebase';
import { isAuthenticated as checkAuthTokens, getToken } from '../services/authService';

// Component to display authentication diagnostic information
const AuthDiagnostics: React.FC = () => {
  const { 
    isAuthenticated, 
    authUser, 
    user, 
    isLoading, 
    error 
  } = useAppContext();
  
  const [tokenInfo, setTokenInfo] = useState<{valid: boolean, token: string | null}>({ valid: false, token: null });
  const [diagnosticInfo, setDiagnosticInfo] = useState<Record<string, any>>({});
  const [showFullToken, setShowFullToken] = useState(false);
  
  // Collect diagnostic information
  useEffect(() => {
    const collectInfo = async () => {
      const token = getToken();
      const tokenValid = checkAuthTokens();
      let tokenPreview = 'None';
      
      if (token) {
        tokenPreview = showFullToken ? token : `${token.substring(0, 10)}...${token.substring(token.length - 10)}`;
      }
      
      setTokenInfo({
        valid: tokenValid,
        token: tokenPreview
      });
      
      // Collect localStorage keys
      const localStorageItems: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          try {
            const value = localStorage.getItem(key);
            if (key.includes('auth') || key.includes('user')) {
              // Redact sensitive information
              localStorageItems[key] = value ? '[REDACTED]' : 'null';
            } else {
              // Show non-sensitive items
              localStorageItems[key] = value || 'null';
            }
          } catch (e) {
            localStorageItems[key] = 'Error reading value';
          }
        }
      }
      
      // Check if Firebase is initialized properly
      const firebaseInitialized = Object.keys(auth).length > 0;
      
      // Gather all diagnostic information
      setDiagnosticInfo({
        browser: navigator.userAgent,
        localStorageItems,
        firebaseInitialized,
        firebaseUser: auth.currentUser ? {
          uid: auth.currentUser.uid,
          email: auth.currentUser.email,
          emailVerified: auth.currentUser.emailVerified,
          isAnonymous: auth.currentUser.isAnonymous,
          providerData: auth.currentUser.providerData?.map(p => ({
            providerId: p.providerId,
            email: p.email
          }))
        } : null,
        authState: {
          isAuthenticated,
          hasAuthUser: !!authUser,
          hasFirebaseUser: !!user,
          isLoading,
          hasError: !!error
        },
        environment: process.env.NODE_ENV,
        timestamp: new Date().toISOString()
      });
    };
    
    collectInfo();
  }, [isAuthenticated, authUser, user, isLoading, error, showFullToken]);
  
  // Format JSON for display
  const formatJson = (obj: any) => {
    return JSON.stringify(obj, null, 2);
  };
  
  // Export diagnostic information
  const exportDiagnostics = () => {
    const diagnosticBlob = new Blob(
      [formatJson(diagnosticInfo)], 
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(diagnosticBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `auth-diagnostics-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // Attempt force refresh of authentication
  const attemptReauthenticate = async () => {
    try {
      if (auth.currentUser) {
        // Force token refresh
        await auth.currentUser.getIdToken(true);
        alert('Firebase token refreshed. Please try logging in again.');
      } else {
        alert('No Firebase user found. Please try logging in again.');
      }
    } catch (e) {
      alert(`Error refreshing authentication: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  
  // Clear all auth data
  const clearAuthData = () => {
    try {
      // Clear auth-related localStorage items
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('auth_expiry');
      
      alert('Auth data cleared. Please refresh the page and try logging in again.');
    } catch (e) {
      alert(`Error clearing auth data: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg p-6 mt-4">
      <h2 className="text-xl font-semibold mb-4">Authentication Diagnostics</h2>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Current Authentication Status</h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-semibold">App Authenticated:</span>
            <span className={`ml-2 ${isAuthenticated ? 'text-green-600' : 'text-red-600'}`}>
              {isAuthenticated ? 'Yes' : 'No'}
            </span>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-semibold">Loading:</span>
            <span className="ml-2">{isLoading ? 'Yes' : 'No'}</span>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-semibold">Auth User:</span>
            <span className={`ml-2 ${authUser ? 'text-green-600' : 'text-red-600'}`}>
              {authUser ? authUser.email : 'None'}
            </span>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-semibold">Firebase User:</span>
            <span className={`ml-2 ${user ? 'text-green-600' : 'text-red-600'}`}>
              {user ? user.email : 'None'}
            </span>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-semibold">Error:</span>
            <span className={`ml-2 ${error ? 'text-red-600' : 'text-green-600'}`}>
              {error || 'None'}
            </span>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <span className="font-semibold">Token Valid:</span>
            <span className={`ml-2 ${tokenInfo.valid ? 'text-green-600' : 'text-red-600'}`}>
              {tokenInfo.valid ? 'Yes' : 'No'}
            </span>
          </div>
        </div>
      </div>
      
      <div className="mb-4">
        <h3 className="text-lg font-medium mb-2">Authentication Token</h3>
        <div className="bg-gray-100 p-2 rounded mb-2 overflow-auto max-h-20">
          <code>{tokenInfo.token || 'No token found'}</code>
        </div>
        <button 
          onClick={() => setShowFullToken(!showFullToken)}
          className="text-blue-600 hover:text-blue-800 text-sm mr-2"
        >
          {showFullToken ? 'Hide Full Token' : 'Show Full Token'}
        </button>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={attemptReauthenticate}
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
        >
          Refresh Authentication
        </button>
        
        <button
          onClick={clearAuthData}
          className="bg-yellow-600 hover:bg-yellow-700 text-white py-2 px-4 rounded"
        >
          Clear Auth Data
        </button>
        
        <button
          onClick={exportDiagnostics}
          className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded"
        >
          Export Diagnostic Info
        </button>
      </div>
      
      <div>
        <h3 className="text-lg font-medium mb-2">Detailed Diagnostic Information</h3>
        <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96 text-xs">
          {formatJson(diagnosticInfo)}
        </pre>
      </div>
    </div>
  );
};

export default AuthDiagnostics; 