// frontend/src/services/api.ts
import axios, { AxiosError, AxiosProgressEvent } from 'axios';
import { CreateRequestInput, FileRequest, UploadedFile, SubscriptionPlan, Subscription } from '../types';
import { API_CONFIG } from '../config/environment';

// Create axios instance
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: API_CONFIG.WITH_CREDENTIALS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
export interface RequestCreationResponse {
  message: string;
  request: {
    id: string;
    description: string;
    link: string;
    expires_at: string;
  }
}

export interface FileUploadResponse {
  message: string;
  file: {
    id: string;
    filename: string;
    content_type: string;
    uploaded_at: string;
  }
}

export interface FileDownloadResponse {
  id: string;
  filename: string;
  download_url: string;
}

export interface StripeCheckoutResponse {
  sessionId: string;
  url: string;
}

// Error handling
function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error: string }>;
    if (axiosError.response) {
      throw new Error(
        axiosError.response.data?.error || 
        `Request failed with status ${axiosError.response.status}`
      );
    } else if (axiosError.request) {
      throw new Error('No response received from server');
    }
  }
  throw new Error('An unexpected error occurred');
}

// Direct export of functions instead of using an object
export function createFileRequest(data: CreateRequestInput) {
  return api.post('/requests', data)
    .then(response => response.data)
    .catch(error => { throw error; });
  }

export function getRequestByLink(link: string) {
  return api.get(`/requests/link/${link}`)
    .then(response => response.data)
    .catch(error => { throw error; });
  }

export function getFileRequestByLink(linkId: string) {
  return api.get(`/requests/link/${linkId}`)
    .then(response => response.data)
    .catch(error => { throw error; });
  }

export function getUserRequests(email: string) {
  return api.get(`/requests/user/${email}`)
    .then(response => response.data)
    .catch(error => { throw error; });
  }

export function uploadFile(requestId: string, file: File) {
  const formData = new FormData();
  formData.append('file', file);
  
  return api.post(`/files/${requestId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  })
    .then(response => response.data)
    .catch(error => { throw error; });
}

export function uploadFileToRequest(
  requestId: string, 
  formData: FormData, 
  onProgress?: (progressEvent: AxiosProgressEvent) => void
) {
  return api.post(`/files/${requestId}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: onProgress
  })
    .then(response => response.data)
    .catch(error => { throw error; });
}

export function uploadFilesToRequest(
  requestId: string,
  formData: FormData,
  onProgress?: (progress: number) => void
) {
  return api.post(`/files/${requestId}/batch`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  })
    .then(response => response.data)
    .catch(error => { throw error; });
}

export function getRequestFiles(requestId: string) {
  return api.get(`/files/${requestId}`)
    .then(response => response.data)
    .catch(error => { throw error; });
}

export function getFileDownloadUrl(fileId: string) {
  return api.get(`/files/download/${fileId}`)
    .then(response => response.data)
    .catch(error => { throw error; });
}

export function downloadAllFiles(requestId: string) {
  return api.get(`/files/download-all/${requestId}`)
    .then(response => response.data)
    .catch(error => { throw error; });
}

export function getSubscriptionPlans() {
  return api.get('/subscriptions/plans')
    .then(response => response.data)
    .catch(error => { throw error; });
}

export function getUserSubscription(userId: string) {
  return api.get(`/subscriptions/my-subscription`)
    .then(response => response.data)
    .catch(error => { throw error; });
}

export function createCheckoutSession(priceId: string, userId: string, email: string) {
  return api.post('/subscriptions/create-checkout', { priceId, userId, email })
    .then(response => response.data)
    .catch(error => { throw error; });
}

export function cancelSubscription() {
  return api.post('/subscriptions/cancel')
    .then(response => response.data)
    .catch(error => { throw error; });
}

// Export the API object as default
export default {
  createFileRequest,
  getRequestByLink,
  getFileRequestByLink,
  getUserRequests,
  uploadFile,
  uploadFileToRequest,
  uploadFilesToRequest,
  getRequestFiles,
  getFileDownloadUrl,
  downloadAllFiles,
  getSubscriptionPlans,
  getUserSubscription,
  createCheckoutSession,
  cancelSubscription
};