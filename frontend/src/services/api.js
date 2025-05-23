import axios from 'axios';

// Configure API base URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request operations
export function createFileRequest(data) {
  return api.post('/requests', data)
    .then(res => res.data)
    .catch(error => { throw error; });
}

export function getRequestByLink(link) {
  return api.get(`/requests/link/${link}`)
    .then(res => res.data)
    .catch(error => { throw error; });
}

export function getFileRequestByLink(linkId) {
  return api.get(`/requests/link/${linkId}`)
    .then(res => res.data)
    .catch(error => { throw error; });
}

export function getUserRequests(email) {
  return api.get(`/requests/user/${email}`)
    .then(res => res.data)
    .catch(error => { throw error; });
}

// File operations
export function uploadFile(requestId, file) {
  const formData = new FormData();
  formData.append('file', file);
  return api.post(`/files/${requestId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }).then(res => res.data);
}

export function uploadFileToRequest(requestId, formData, onProgress) {
  return api.post(`/files/${requestId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
  }).then(res => res.data);
}

export function uploadFilesToRequest(requestId, formData, onProgress) {
  return api.post(`/files/${requestId}/batch`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total && onProgress) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        onProgress(percentCompleted);
      }
    }
  })
  .then(res => {
    // Log the response for debugging
    console.log('Upload response:', res.data);
    return res.data;
  })
  .catch(error => {
    console.error('Upload error:', error);
    throw error;
  });
}

export function getRequestFiles(requestId) {
  return api.get(`/files/${requestId}`)
    .then(res => res.data)
    .catch(error => { throw error; });
}

export function getFileDownloadUrl(fileId) {
  return api.get(`/files/download/${fileId}`)
    .then(res => res.data)
    .catch(error => { throw error; });
}

export function downloadAllFiles(requestId) {
  return api.get(`/files/download-all/${requestId}`)
    .then(res => res.data)
    .catch(error => { throw error; });
}

// Subscription operations
export function getSubscriptionPlans() {
  return api.get('/subscriptions/plans')
    .then(res => res.data)
    .catch(error => { throw error; });
}

export function getUserSubscription(userId) {
  return api.get(`/subscriptions/my-subscription`)
    .then(res => res.data)
    .catch(error => { throw error; });
}

export function createCheckoutSession(priceId, userId, email) {
  return api.post('/subscriptions/create-checkout', { priceId, userId, email })
    .then(res => res.data)
    .catch(error => { throw error; });
}

export function cancelSubscription() {
  return api.post('/subscriptions/cancel')
    .then(res => res.data)
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