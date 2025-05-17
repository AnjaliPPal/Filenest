import axios from 'axios';

// Configure API base URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

/**
 * Get file request by unique link
 * @param {string} link - The unique link identifier
 * @returns {Promise<Object>} The file request data
 */
export const getFileRequestByLink = async (link) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/requests/link/${link}`);
    return response.data.request;
  } catch (error) {
    console.error('Error fetching request:', error);
    throw error;
  }
};

/**
 * Upload a file to a specific request (single file upload)
 * @param {string} requestId - The unique ID or link of the request
 * @param {FormData} formData - FormData containing the file
 * @param {Function} onProgress - Optional callback for upload progress (0-100)
 * @returns {Promise<Object>} Response with upload results
 */
export const uploadFileToRequest = async (requestId, formData, onProgress) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/files/${requestId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

/**
 * Upload multiple files to a request in a single API call
 * @param {string} requestId - The unique ID or link of the request
 * @param {FormData} formData - FormData containing files under the 'files' field
 * @param {Function} onProgress - Optional callback for upload progress (0-100)
 * @returns {Promise<Object>} Response with upload results
 */
export const uploadFilesToRequest = async (requestId, formData, onProgress) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/files/${requestId}/batch`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading files:', error);
    throw error;
  }
};

/**
 * Get user's file requests
 * @param {string} email - User's email
 * @returns {Promise<Array>} List of file requests
 */
export const getUserRequests = async (email) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/requests/user/${email}`);
    return response.data.requests || [];
  } catch (error) {
    console.error('Error fetching user requests:', error);
    throw error;
  }
};

/**
 * Create a new file request
 * @param {Object} data - Request data (email, description, deadline)
 * @returns {Promise<Object>} The created request
 */
export const createFileRequest = async (data) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/requests`, data);
    return response.data;
  } catch (error) {
    console.error('Error creating file request:', error);
    throw error;
  }
};

/**
 * Get files for a specific request
 * @param {string} requestId - The ID of the request
 * @returns {Promise<Array>} List of files associated with the request
 */
export const getRequestFiles = async (requestId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/files/${requestId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching files for request ${requestId}:`, error);
    return [];
  }
};

/**
 * Download all files for a request
 * @param {string} requestId - The ID of the request
 * @returns {Promise<Array>} List of download URLs for files
 */
export const downloadAllFiles = async (requestId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/files/download-all/${requestId}`);
    return response.data;
  } catch (error) {
    console.error('Error downloading files:', error);
    return [];
  }
}; 