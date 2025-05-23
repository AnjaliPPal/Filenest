// apiService.js - Simple API service without TypeScript
import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Create axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
});

// File request operations
export function createFileRequest(data) {
  return api.post('/requests', data).then(res => res.data);
}

export function getRequestByLink(link) {
  return api.get(`/requests/link/${link}`).then(res => res.data);
}

export function getFileRequestByLink(linkId) {
  return api.get(`/requests/link/${linkId}`).then(res => res.data);
}

export function getUserRequests(email) {
  return api.get(`/requests/user/${email}`).then(res => res.data);
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

export function getRequestFiles(requestId) {
  return api.get(`/files/${requestId}`).then(res => res.data);
}

export function getFileDownloadUrl(fileId) {
  return api.get(`/files/download/${fileId}`).then(res => res.data);
}

export function downloadAllFiles(requestId) {
  return api.get(`/files/download-all/${requestId}`).then(res => res.data);
}

// Subscription operations
export function getSubscriptionPlans() {
  return api.get('/subscriptions/plans').then(res => res.data);
}

export function getUserSubscription(userId) {
  return api.get('/subscriptions/my-subscription').then(res => res.data);
}

export function createCheckoutSession(priceId, userId, email) {
  return api.post('/subscriptions/create-checkout', { priceId, userId, email })
    .then(res => res.data);
}

export function cancelSubscription() {
  return api.post('/subscriptions/cancel').then(res => res.data);
} 