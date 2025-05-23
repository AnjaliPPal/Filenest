import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react';
import { FileRequest, CreateRequestInput, Subscription, SubscriptionTier } from '../types';
import { 
  createFileRequest, 
  getUserRequests, 
  createCheckoutSession
} from '../services/apiService';
import { useLocalStorage } from '../hooks/useLocalStorage';
// Import Firebase auth services
import { User as FirebaseUser } from 'firebase/auth';
import { 
  signInWithGoogle as firebaseSignInWithGoogle,
  logoutUser as firebaseLogoutUser,
  subscribeToAuthChanges,
  loginWithEmail,
  getCurrentUser as getStoredUser,
  isAuthenticated,
  initializeAuth,
  AuthUser,
  loginWithGoogleToken
} from '../services/authService';

interface AppContextState {
  userEmail: string | null;
  user: FirebaseUser | null;
  authUser: AuthUser | null;
  requests: FileRequest[];
  isLoading: boolean;
  error: string | null;
  userSubscription: Subscription | null;
  isAuthenticated: boolean;
}

interface AppContextValue extends AppContextState {
  setUserEmail: (email: string) => void;
  createRequest: (data: CreateRequestInput) => Promise<{ success: boolean; link?: string; error?: string }>;
  fetchUserRequests: (email: string) => Promise<void>;
  clearError: () => void;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<boolean>;
  loginWithEmail: (email: string) => Promise<boolean>;
  createCheckout: (priceId: string) => Promise<{ url?: string; error?: string } | null>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

// Create a default user subscription
const DEFAULT_SUBSCRIPTION: Subscription = {
  id: 'default',
  user_id: 'guest',
  tier: SubscriptionTier.FREE,
  is_active: true,
  start_date: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use our custom hook for localStorage
  const [userEmail, setUserEmailStorage] = useLocalStorage<string | null>('userEmail', null);
  
  // Auth state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [isAuthenticatedState, setIsAuthenticated] = useState<boolean>(false);
  
  // Other state that doesn't need to persist
  const [requests, setRequests] = useState<FileRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize with default subscription
  const [userSubscription, setUserSubscription] = useState<Subscription | null>(DEFAULT_SUBSCRIPTION);

  // Track initialization to prevent multiple auth setups
  const initializedRef = useRef(false);
  const setUserEmailRef = useRef(setUserEmailStorage);
  
  // Update ref when setUserEmailStorage changes
  useEffect(() => {
    setUserEmailRef.current = setUserEmailStorage;
  }, [setUserEmailStorage]);

  // Initialize auth - only once
  useEffect(() => {
    if (initializedRef.current) return;
    
    initializedRef.current = true;
    
    initializeAuth();
    
    // Check for stored user
    const storedUser = getStoredUser();
    if (storedUser) {
      setAuthUser(storedUser);
      setIsAuthenticated(true);
      setUserEmailRef.current(storedUser.email);
    }
  }, []); // No dependencies

  // Setup auth listener - only once
  useEffect(() => {
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      
      if (currentUser) {
        // Update email using ref to avoid dependency issues
        if (currentUser.email) {
          setUserEmailRef.current(currentUser.email);
        }
        
        // Only update auth state if we don't already have an authenticated user
        // This prevents conflicts with manual state updates from login functions
        const storedUser = getStoredUser();
        if (storedUser && !authUser) {
          setAuthUser(storedUser);
          setIsAuthenticated(true);
        } else if (!storedUser) {
          // User signed in with Firebase but not authenticated with backend
        } else {
          // Auth context already has user, skipping update
        }
      } else {
        // No user
        setAuthUser(null);
        setIsAuthenticated(false);
      }
    });
    
    return unsubscribe;
  }, []); // No dependencies

  const setUserEmail = useCallback((email: string) => {
    setUserEmailRef.current(email);
  }, []); // No dependencies

  const fetchUserRequests = useCallback(async (email: string) => {
    if (!email) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedRequests = await getUserRequests(email);
      setRequests(fetchedRequests);
      setIsLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch your requests';
      setIsLoading(false);
      setError(errorMessage);
    }
  }, []);

  const createRequest = useCallback(async (data: CreateRequestInput) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await createFileRequest(data);
      
      if (userEmail === data.recipientEmail) {
        fetchUserRequests(data.recipientEmail);
      } else {
        setUserEmail(data.recipientEmail);
      }
      
      setIsLoading(false);
      return {
        success: true,
        link: `${process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000'}/upload/${response.request.unique_link}`
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setIsLoading(false);
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage
      };
    }
  }, [userEmail, setUserEmail, fetchUserRequests]);

  const createCheckout = useCallback(async (priceId: string) => {
    if (!authUser || !authUser.email) {
      setError('You must be logged in to upgrade');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await createCheckoutSession(priceId, authUser.id, authUser.email);
      setIsLoading(false);
      return {
        url: response.url
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create checkout session';
      setIsLoading(false);
      setError(errorMessage);
      return { error: errorMessage };
    }
  }, [authUser]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  const logout = useCallback(async () => {
    try {
      await firebaseLogoutUser();
      setUserEmailRef.current(null);
      setRequests([]);
      setUser(null);
      setAuthUser(null);
      setUserSubscription(DEFAULT_SUBSCRIPTION);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []); // No dependencies

  const loginWithEmailFn = useCallback(async (email: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const user = await loginWithEmail(email);
      if (user) {
        setAuthUser(user);
        setUserEmail(user.email);
        setIsAuthenticated(true);
        
        setIsLoading(false);
        return true;
      }
      
      setIsLoading(false);
      setError('Failed to log in with email');
      return false;
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Exception during email login:', error);
      return false;
    }
  }, []); // Remove setUserEmail dependency

  const loginWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const user = await firebaseSignInWithGoogle();
      
      if (user) {
        // Wait a moment for backend authentication to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check for stored user after backend auth completes
        const authUserFromStorage = getStoredUser();
        
        if (authUserFromStorage) {
          // Manually update context state - don't wait for Firebase listener
          
          // Update state in sequence to ensure proper updates
          setAuthUser(authUserFromStorage);
          setIsAuthenticated(true);
          
          if (authUserFromStorage.email) {
            setUserEmail(authUserFromStorage.email);
          }
          
          // Clear loading state after auth state is set
          setIsLoading(false);
          
          return true;
        } else {
          // Backend auth failed - retry check after short delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const retryUser = getStoredUser();
          if (retryUser) {
            
            setAuthUser(retryUser);
            setIsAuthenticated(true);
            
            if (retryUser.email) {
              setUserEmail(retryUser.email);
            }
            
            setIsLoading(false);
            
            return true;
          }
        }
      }
      
      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Google login error:', error);
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      return false;
    }
  }, []); // Remove setUserEmail dependency

  const value = {
    userEmail,
    user,
    authUser,
    requests,
    isLoading,
    error,
    isAuthenticated: isAuthenticatedState,
    setUserEmail,
    createRequest,
    fetchUserRequests,
    clearError,
    logout,
    loginWithGoogle,
    loginWithEmail: loginWithEmailFn,
    userSubscription,
    createCheckout
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = (): AppContextValue => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}; 