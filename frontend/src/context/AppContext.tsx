import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { FileRequest, CreateRequestInput } from '../types';
import { createFileRequest, getUserRequests } from '../services/api';
import { useLocalStorage } from '../hooks/useLocalStorage';
// Import Firebase auth services
import { User as FirebaseUser } from 'firebase/auth';
import { 
  signInWithGoogle as firebaseSignInWithGoogle,
  logoutUser as firebaseLogoutUser,
  subscribeToAuthChanges
} from '../services/authService';

interface AppContextState {
  userEmail: string | null;
  user: FirebaseUser | null;
  requests: FileRequest[];
  isLoading: boolean;
  error: string | null;
}

interface AppContextValue extends AppContextState {
  setUserEmail: (email: string) => void;
  createRequest: (data: CreateRequestInput) => Promise<{ success: boolean; link?: string; error?: string }>;
  fetchUserRequests: (email: string) => Promise<void>;
  clearError: () => void;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use our custom hook for localStorage
  const [userEmail, setUserEmailStorage] = useLocalStorage<string | null>('userEmail', null);
  
  // Auth state
  const [user, setUser] = useState<FirebaseUser | null>(null);
  
  // Other state that doesn't need to persist
  const [requests, setRequests] = useState<FileRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize auth state
  useEffect(() => {
    // Set up auth state listener
    const unsubscribe = subscribeToAuthChanges((currentUser) => {
      setUser(currentUser);
      if (currentUser?.email) {
        setUserEmailStorage(currentUser.email);
      }
    });

    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, [setUserEmailStorage]);

  const setUserEmail = useCallback((email: string) => {
    setUserEmailStorage(email);
  }, [setUserEmailStorage]);

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
      
      // If we have a user email set, we might want to add this to their requests
      if (userEmail === data.email) {
        fetchUserRequests(data.email);
      } else {
        setUserEmail(data.email);
      }
      
      setIsLoading(false);
      return {
        success: true,
        link: response.request.link
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

  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  const logout = useCallback(async () => {
    try {
      await firebaseLogoutUser();
      setUserEmailStorage(null);
      setRequests([]);
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, [setUserEmailStorage]);

  const loginWithGoogle = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Starting Google login process with Firebase...');
      
      const user = await firebaseSignInWithGoogle();
      console.log('Firebase sign in successful:', !!user);
      
      if (user?.email) {
        setUserEmail(user.email);
      }
      
      setIsLoading(false);
    } catch (error) {
      setIsLoading(false);
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Exception during Google sign in:', error);
    }
  }, [setUserEmail]);

  const value = {
    userEmail,
    user,
    requests,
    isLoading,
    error,
    setUserEmail,
    createRequest,
    fetchUserRequests,
    clearError,
    logout,
    loginWithGoogle
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