import { 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User as FirebaseUser,
  signInWithRedirect,
  getRedirectResult,
  Auth,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../config/firebase';
import axios from 'axios';
import { API_CONFIG } from '../config/environment';

// Local storage keys
const TOKEN_KEY = 'auth_token';
const USER_DATA_KEY = 'user_data';
const TOKEN_EXPIRY_KEY = 'auth_expiry';

// Types
export interface AuthUser {
  id: string;
  email: string;
  subscription?: string;
}

// API instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: API_CONFIG.WITH_CREDENTIALS,
});

// Google authentication provider
const googleProvider = new GoogleAuthProvider();

// Get typed auth instance
const firebaseAuth = auth as Auth;

// Sign in with Google popup
export const signInWithGoogle = async (): Promise<FirebaseUser | null> => {
  try {
    // Use popup for Google authentication
    const googleProvider = new GoogleAuthProvider();
    googleProvider.setCustomParameters({
      prompt: 'select_account'
    });
    
    const result = await signInWithPopup(firebaseAuth, googleProvider);
    
    if (result?.user) {
      const idToken = await result.user.getIdToken();
      await loginWithGoogleToken(idToken);
      return result.user;
    }
    
    return null;
  } catch (error: any) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};

// Login with Google token (to our backend)
export const loginWithGoogleToken = async (token: string): Promise<AuthUser | null> => {
  try {
    const response = await api.post('/auth/login/google', { token });
    
    if (response.data?.token) {
      // Store token and user data
      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
      
      // Store token expiry time
      const expiryTime = Date.now() + (response.data.expiresIn * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      // Set authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      return response.data.user;
    }
    
    return null;
  } catch (error) {
    console.error('Error verifying Google token with backend:', error);
    throw error;
  }
};

// Login with email
export const loginWithEmail = async (email: string): Promise<AuthUser | null> => {
  try {
    // Validate email
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      throw new Error('Invalid email format');
    }

    const response = await api.post('/auth/login/email', { email });
    
    if (response.data?.token) {
      // Store token and user data
      localStorage.setItem(TOKEN_KEY, response.data.token);
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(response.data.user));
      
      // Store token expiry time
      const expiryTime = Date.now() + (response.data.expiresIn * 1000);
      localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
      
      // Set authorization header for future requests
      api.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      return response.data.user;
    }
    return null;
  } catch (error) {
    console.error('Error logging in with email:', error);
    throw error;
  }
};

// Get current user from local storage
export const getCurrentUser = (): AuthUser | null => {
  // Check if token is valid before returning user
  if (!isAuthenticated()) {
    return null;
  }
  
  const userData = localStorage.getItem(USER_DATA_KEY);
  if (userData) {
    try {
      return JSON.parse(userData);
    } catch (e) {
      localStorage.removeItem(USER_DATA_KEY);
    }
  }
  return null;
};

// Get current token
export const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

// Clear all authentication data
const clearAuthData = (): void => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_DATA_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
  
  // Also clear headers
  if (api.defaults.headers.common['Authorization']) {
    delete api.defaults.headers.common['Authorization'];
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem(TOKEN_KEY);
  if (!token) {
    return false;
  }
  
  // Check if token is expired
  const tokenExpiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!tokenExpiry) {
    clearAuthData();
    return false;
  }
  
  const expiryTime = parseInt(tokenExpiry, 10);
  if (Date.now() > expiryTime) {
    clearAuthData();
    return false;
  }
  
  return true;
};

// Logout user
export const logoutUser = async (): Promise<void> => {
  try {
    // Call backend logout API
    const token = getToken();
    if (token) {
      try {
        await api.post('/auth/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      } catch (e) {
        console.warn('Error logging out from API:', e);
      }
    }
    
    // Clear local storage
    clearAuthData();
    
    // Firebase logout
    if (firebaseAuth.currentUser) {
      await signOut(firebaseAuth);
    }
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

// Setup auth interceptor for API requests
export const setupAuthInterceptor = () => {
  // Add token to requests
  api.interceptors.request.use(
    (config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  // Handle 401 responses
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response && error.response.status === 401) {
        // Token expired or invalid, log out
        clearAuthData();
        window.location.href = '/login';
      }
      return Promise.reject(error);
    }
  );
};

// Initialize auth (call this when app starts)
export const initializeAuth = () => {
  setupAuthInterceptor();
  
  // Set token in axios headers if it exists and is valid
  if (isAuthenticated()) {
    const token = getToken();
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
  }
};

// Subscribe to auth changes (from Firebase)
export const subscribeToAuthChanges = (callback: (user: FirebaseUser | null) => void) => {
  return onAuthStateChanged(firebaseAuth, callback);
}; 