import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { FileRequest, CreateRequestInput, Subscription, SubscriptionTier } from '../types';
import { API_CONFIG } from '../config/environment';

// Default values for when API calls fail
export const DEFAULT_SUBSCRIPTION: Subscription = {
  id: 'default',
  user_id: 'guest',
  tier: SubscriptionTier.FREE,
  is_active: true,
  start_date: new Date().toISOString(),
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Error tracking and caching variables
let consecutiveErrorCount = 0;
const MAX_CONSECUTIVE_ERRORS = 3;
let cache = new Map<string, {data: any, timestamp: number}>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Cache helper function
const cachedRequest = async (endpoint: string): Promise<any> => {
  const now = Date.now();
  const cached = cache.get(endpoint);
  
  // Return cached data if valid
  if (cached && now - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }
  
  try {
    // Make API request
    const response = await apiClient.get(endpoint);
    
    // Cache the response
    cache.set(endpoint, {
      data: response.data,
      timestamp: now
    });
    
    // Reset error count on success
    consecutiveErrorCount = 0;
    
    return response.data;
  } catch (error) {
    // Increment error count on failure
    consecutiveErrorCount++;
    
    // If we have cached data, return it even if expired
    if (cached) {
      return cached.data;
    }
    
    throw error;
  }
};

// Setup API client
const apiClient: AxiosInstance = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  timeout: 15000
});

// Add a request interceptor for auth headers
apiClient.interceptors.request.use(
  (config) => {
    // Get auth token from storage
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => {
    // Reset error count on successful responses
    consecutiveErrorCount = 0;
    return response;
  },
  (error) => {
    // Increment error count on failed responses
    consecutiveErrorCount++;
    
    // Handle unauthorized responses
    if (error.response && error.response.status === 401) {
      // Clear auth data and redirect to login
      localStorage.removeItem('auth_token');
      localStorage.removeItem('user_data');
      localStorage.removeItem('auth_expiry');
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

// Create a new file request
export const createFileRequest = async (data: CreateRequestInput): Promise<{ request: FileRequest }> => {
  try {
    // Check for authentication token before making request
    const token = localStorage.getItem('auth_token');
    if (!token) {
      throw new Error('Authentication required to create file requests. Please sign in.');
    }

    const response = await apiClient.post('/requests', data);
    return response.data;
  } catch (error) {
    console.error('Error creating file request:', error);
    throw error;
  }
};

// Get requests associated with an email
export const getUserRequests = async (email: string): Promise<FileRequest[]> => {
  try {
    const response = await apiClient.get(`/requests/user/${email}`);
    return response.data.requests || [];
  } catch (error) {
    console.error('Error fetching user requests:', error);
    return []; // Return empty array instead of throwing
  }
};

// Get a single request by ID
export const getRequestById = async (requestId: string): Promise<FileRequest> => {
  try {
    const response = await apiClient.get(`/requests/${requestId}`);
    return response.data.request;
  } catch (error) {
    console.error('Error fetching request:', error);
    throw error;
  }
};

// Upload a file
export const uploadFile = async (requestId: string, file: File): Promise<{ success: boolean, message: string }> => {
  try {
    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(`/files/${requestId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Create a checkout session with Stripe
export const createCheckoutSession = async (priceId: string, userId: string, userEmail: string): Promise<{ url: string }> => {
  try {
    const response = await apiClient.post('/subscriptions/checkout', { priceId, userId, userEmail });
    return response.data;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

// Get user subscription
let subscriptionRequestInProgress = false;
let lastSubscriptionResponse: {data: any, timestamp: number} | null = null;

export const getUserSubscription = async (): Promise<Subscription> => {
  // Emergency bypass - return default subscription if too many errors
  if (consecutiveErrorCount >= MAX_CONSECUTIVE_ERRORS) {
    return DEFAULT_SUBSCRIPTION;
  }
  
  try {
    // If a request is already in progress, return last response or wait
    if (subscriptionRequestInProgress) {
      // If we have a recent response, return it
      if (lastSubscriptionResponse && 
          Date.now() - lastSubscriptionResponse.timestamp < 30000) { // 30 seconds validity
        return lastSubscriptionResponse.data.subscription;
      }
      
      // Don't wait, just return default
      return DEFAULT_SUBSCRIPTION;
    }
    
    // Mark request as in progress
    subscriptionRequestInProgress = true;
    
    try {
      // Use cache for this frequent call
      const data = await cachedRequest('/subscriptions/current');
      
      // Store the response for potential reuse
      lastSubscriptionResponse = {
        data,
        timestamp: Date.now()
      };
      
      subscriptionRequestInProgress = false;
      return data.subscription;
    } catch (error) {
      subscriptionRequestInProgress = false;
      return DEFAULT_SUBSCRIPTION; // Return default instead of throwing
    }
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return DEFAULT_SUBSCRIPTION; // Return default instead of throwing
  }
};

// Clear the API cache
export const clearApiCache = (): void => {
  cache.clear();
  consecutiveErrorCount = 0;
}; 