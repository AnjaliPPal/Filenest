import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { uploadFileToRequest, getFileRequestByLink } from '../services/api';
import { AxiosProgressEvent } from 'axios';
import axios from 'axios';

// Import directly to bypass TypeScript checking for JS imports
// @ts-ignore
import { uploadFilesToRequest as uploadMultipleFiles } from '../services/api';

// Configure API base URL from environment or use default
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Constants
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_FILE_TYPES = [
  // Documents
  'application/pdf', 'application/msword', 
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  
  // Images
  'image/jpeg', 'image/png', 'image/gif', 'image/svg+xml', 'image/webp',
  
  // Archives
  'application/zip', 'application/x-rar-compressed',
  
  // Others
  'application/json', 'text/html', 'text/csv'
];

// Utility to format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  else if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  else return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
};

// Get icon for file type
const getFileIcon = (fileType: string): string => {
  if (fileType.includes('image')) return '🖼️';
  if (fileType.includes('pdf')) return '📄';
  if (fileType.includes('word')) return '📝';
  if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
  if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📙';
  if (fileType.includes('zip') || fileType.includes('rar')) return '🗄️';
  if (fileType.includes('text')) return '📃';
  return '📎';
};

const UploadPage: React.FC = () => {
  const { requestId } = useParams<{ requestId: string }>();
  const navigate = useNavigate();
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requestDetails, setRequestDetails] = useState<{
    description: string;
    deadline?: string;
    expires_at: string;
    is_active: boolean;
  } | null>(null);
  const [isExpired, setIsExpired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch request details and check expiry
  useEffect(() => {
    const fetchRequestDetails = async () => {
      if (!requestId) return;
      
      try {
        setIsLoading(true);
        const response = await getFileRequestByLink(requestId);
        
        setRequestDetails(response);
        
        // Check if request is expired
        const now = new Date();
        const expiryDate = new Date(response.expires_at);
        
        if (now > expiryDate || !response.is_active) {
          setIsExpired(true);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Failed to fetch request details", err);
        setError("This upload link is invalid or has been removed.");
        setIsLoading(false);
      }
    };
    
    fetchRequestDetails();
  }, [requestId]);

  const validateFile = (file: File): { valid: boolean; message?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return { 
        valid: false, 
        message: `File "${file.name}" is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB.` 
      };
    }
    
    // Check file type (optional - remove if you don't want to restrict file types)
    if (ALLOWED_FILE_TYPES.length > 0 && !ALLOWED_FILE_TYPES.includes(file.type)) {
      return { 
        valid: false, 
        message: `File type "${file.type}" is not supported for "${file.name}".` 
      };
    }
    
    return { valid: true };
  };

  const handleFileValidationError = (message: string) => {
    setErrorModalMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorModalMessage('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      let validFiles: File[] = [];
      let hasError = false;
      
      files.forEach(file => {
        const { valid, message } = validateFile(file);
        if (valid) {
          validFiles.push(file);
        } else {
          hasError = true;
          if (message) handleFileValidationError(message);
        }
      });
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        setSuccess(false);
        setError(null);
      }
      
      // Clear the input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      let validFiles: File[] = [];
      let hasError = false;
      
      files.forEach(file => {
        const { valid, message } = validateFile(file);
        if (valid) {
          validFiles.push(file);
        } else {
          hasError = true;
          if (message) handleFileValidationError(message);
        }
      });
      
      if (validFiles.length > 0) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
        setSuccess(false);
        setError(null);
      }
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllFiles = () => {
    setSelectedFiles([]);
    setFileError(null);
  };

  const handleChooseFile = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleUpload = async () => {
    if (!selectedFiles.length || !requestId) return;
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      // Create a single FormData with all files
      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });
      
      // Use the batch upload API
      await uploadMultipleFiles(requestId, formData, (progress: number) => {
        setUploadProgress(progress);
      });
      
      setSuccess(true);
      setSelectedFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Upload failed:', err);
      setError('Failed to upload files. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  // Render expired view
  const renderExpiredView = () => (
    <div className="text-center py-10">
      <div className="bg-red-100 text-red-800 p-4 rounded-lg inline-flex items-center mb-6">
        <svg className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium">This upload link has expired</span>
      </div>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">
        This file upload link is no longer active. It may have expired or been disabled by the requestor.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Return Home
      </button>
    </div>
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-8 bg-white rounded-lg shadow-md flex justify-center items-center py-16">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600">Loading upload page...</p>
        </div>
      </div>
    );
  }

  // Show expired view
  if (isExpired) {
    return (
      <div className="max-w-3xl mx-auto mt-8 p-8 bg-white rounded-lg shadow-md">
        {renderExpiredView()}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto mt-8 p-8 bg-white rounded-lg shadow-md">
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-start mb-4">
              <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-lg font-medium text-gray-900">File Error</h3>
                <p className="mt-2 text-sm text-gray-500">{errorModalMessage}</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={closeErrorModal}
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header with request details */}
      <div className="bg-blue-600 p-6 text-white rounded-t-lg">
        <h1 className="text-2xl font-bold mb-2">File Upload Requested</h1>
        {requestDetails ? (
          <>
            <p className="text-blue-100 mb-3">{requestDetails.description}</p>
            {requestDetails.deadline && (
              <div className="mt-2 inline-flex items-center bg-blue-700 px-3 py-1 rounded-md text-sm">
                <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Due by: {new Date(requestDetails.deadline).toLocaleDateString()}
              </div>
            )}
            <div className="mt-2 inline-flex items-center bg-blue-700 px-3 py-1 rounded-md text-sm ml-2">
              <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Expires: {new Date(requestDetails.expires_at).toLocaleDateString()}
            </div>
          </>
        ) : (
          <p className="text-blue-100 mb-3">Please upload your files for this request.</p>
        )}
      </div>

      <div className="p-6">
        {/* Success and error messages */}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-6 py-4 rounded mb-6">
            <div className="flex items-center">
              <svg className="h-6 w-6 mr-2 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <div>
                <h3 className="font-medium">Success!</h3>
                <p className="text-sm">Your files have been uploaded successfully. Thank you!</p>
              </div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Drag and Drop area */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 mb-6 text-center cursor-pointer transition-colors ${
            dragActive ? 'border-blue-500 bg-blue-50' : selectedFiles.length ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleChooseFile}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            aria-label="File input"
            onChange={handleFileChange}
            disabled={uploading}
          />
          <div className="py-4">
            <svg className="h-12 w-12 mx-auto mb-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <h3 className="text-lg font-semibold mb-2 text-gray-800">
              Drag & drop files here or click to browse
            </h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto">
              Max file size: {MAX_FILE_SIZE / (1024 * 1024)}MB
            </p>
          </div>
        </div>

        {/* File validation error */}
        {fileError && (
          <div className="p-3 bg-red-50 text-red-700 border border-red-100 rounded-md mb-6 text-sm">
            {fileError}
          </div>
        )}

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-gray-700">Selected Files ({selectedFiles.length})</h3>
              {selectedFiles.length > 1 && (
                <button
                  type="button"
                  onClick={handleClearAllFiles}
                  disabled={uploading}
                  className="text-sm text-red-500 hover:text-red-700"
                >
                  Clear All
                </button>
              )}
            </div>
            <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md overflow-hidden">
              {selectedFiles.map((file, idx) => (
                <li key={idx} className="flex items-center justify-between p-3 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <span className="text-xl" role="img" aria-label="File type">
                      {getFileIcon(file.type)}
                    </span>
                    <div className="flex flex-col">
                      <span className="truncate max-w-xs text-gray-800 text-sm font-medium">
                        {file.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)} • {file.type.split('/')[1] || file.type}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="text-red-500 hover:text-red-700 p-1"
                    onClick={() => handleRemoveFile(idx)}
                    disabled={uploading}
                    aria-label="Remove file"
                  >
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Upload progress */}
        {uploading && (
          <div className="mb-6">
            <div className="flex justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">Uploading...</span>
              <span className="text-sm font-medium text-gray-700">{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={uploading || selectedFiles.length === 0}
          className="w-full py-3 px-4 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? `Sending ${selectedFiles.length} ${selectedFiles.length === 1 ? 'file' : 'files'}...` : `Send ${selectedFiles.length} ${selectedFiles.length === 1 ? 'file' : 'files'}`}
        </button>
      </div>

      {/* Instructions */}
      <div className="bg-gray-50 p-6 border-t border-gray-200 rounded-b-lg">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Instructions</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex items-start">
            <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Drag and drop files or click to browse and add them.</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Review your file list before sending. You can delete files before upload.</span>
          </li>
          <li className="flex items-start">
            <svg className="h-5 w-5 text-blue-500 mr-2 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Click "Send Files" to upload all files at once.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default UploadPage; 