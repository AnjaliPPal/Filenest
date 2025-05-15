// frontend/src/services/api.ts
import axios, { AxiosError, AxiosProgressEvent } from 'axios';
import { CreateRequestInput, FileRequest, UploadedFile } from '../types';
import { API_CONFIG } from '../config/environment';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_CONFIG.BASE_URL,
  timeout: API_CONFIG.TIMEOUT,
  withCredentials: API_CONFIG.WITH_CREDENTIALS,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response types
export interface ApiResponse<T> {
  data: T;
  status: number;
  statusText: string;
}

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
  download_url: string;
}

// Error handling
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<{ error: string }>;
    if (axiosError.response) {
      throw new Error(
        axiosError.response.data?.error || 
        `Request failed with status ${axiosError.response.status}`
      );
    } else if (axiosError.request) {
      throw new Error('No response received from server. Please check your connection.');
    }
  }
  throw new Error('An unexpected error occurred');
};

// Request creators
export const createFileRequest = async (data: CreateRequestInput): Promise<RequestCreationResponse> => {
  try {
    const response = await api.post<RequestCreationResponse>('/requests', data);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getRequestByLink = async (link: string): Promise<FileRequest> => {
  try {
    const response = await api.get<FileRequest>(`/requests/link/${link}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// This function is specifically for the upload page to get file request info by link ID
export const getFileRequestByLink = async (linkId: string): Promise<any> => {
  try {
    const response = await api.get(`/requests/link/${linkId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getUserRequests = async (email: string): Promise<FileRequest[]> => {
  try {
    const response = await api.get<FileRequest[]>(`/requests/user/${email}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const uploadFile = async (requestId: string, file: File): Promise<FileUploadResponse> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post<FileUploadResponse>(`/files/${requestId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Upload file with progress tracking
export const uploadFileToRequest = async (
  requestId: string, 
  formData: FormData, 
  onProgress?: (progressEvent: AxiosProgressEvent) => void
): Promise<FileUploadResponse> => {
  try {
    const response = await api.post<FileUploadResponse>(
      `/files/${requestId}`, 
      formData, 
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: onProgress
      }
    );
    
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getRequestFiles = async (requestId: string): Promise<UploadedFile[]> => {
  try {
    const response = await api.get<UploadedFile[]>(`/files/${requestId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const getFileDownloadUrl = async (fileId: string): Promise<FileDownloadResponse> => {
  try {
    const response = await api.get<FileDownloadResponse>(`/files/download/${fileId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

export const downloadAllFiles = async (requestId: string): Promise<FileDownloadResponse[]> => {
  try {
    const response = await api.get<FileDownloadResponse[]>(`/files/download-all/${requestId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error);
  }
};

// Add response interceptor for global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Add request interceptor for authentication
api.interceptors.request.use(
  (config) => {
    // You can add auth token here in the future
    // const token = localStorage.getItem('authToken');
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;