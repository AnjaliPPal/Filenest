import React, { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { uploadFilesToRequest, getFileRequestByLink } from '../services/api.js';
import { AxiosProgressEvent } from 'axios';
import axios from 'axios';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';

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
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
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

  // Function to fetch request details - moved outside useEffect so it can be reused
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

  // Fetch request details and check expiry
  useEffect(() => {
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
    if (selectedFiles.length === 0 || !requestId) return;
    
    try {
      setUploading(true);
      setError('');
      setSuccess(false);
      setUploadProgress(0);
      
      // Upload all files
      const uploadPromises = selectedFiles.map(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        
        const uploadResponse = await axios.post(
          `${API_BASE_URL}/files/${requestId}`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                setUploadProgress(percentCompleted);
              }
            },
          }
        );
        
        return uploadResponse.data;
      });
      
      const results = await Promise.all(uploadPromises);
      
      // Refresh request details to get the latest files
      await fetchRequestDetails();
      
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
    <div className="text-center py-8 sm:py-12">
      <div className="bg-red-100 text-red-800 p-4 sm:p-6 rounded-lg sm:rounded-xl inline-flex items-center mb-6 sm:mb-8 max-w-md mx-auto">
        <svg className="h-6 w-6 sm:h-8 sm:w-8 mr-2 sm:mr-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="font-medium text-sm sm:text-base">This upload link has expired</span>
      </div>
      <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base leading-relaxed px-4">
        This file upload link is no longer active. It may have expired or been disabled by the requestor.
      </p>
      <button
        onClick={() => navigate('/')}
        className="px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 text-white rounded-lg sm:rounded-xl hover:bg-primary-700 transition-colors text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
      >
        Return Home
      </button>
    </div>
  );

  // Show loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg sm:rounded-xl shadow-md p-6 sm:p-8 flex justify-center items-center py-12 sm:py-16">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-primary-500 mb-4"></div>
            <p className="text-gray-600 text-sm sm:text-base">Loading upload page...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show expired view
  if (isExpired) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="max-w-3xl mx-auto bg-white rounded-lg sm:rounded-xl shadow-md p-6 sm:p-8">
          {renderExpiredView()}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg sm:rounded-xl shadow-md overflow-hidden">
        {/* Error Modal */}
        {showErrorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-lg sm:rounded-xl shadow-xl p-4 sm:p-6 max-w-md w-full">
              <div className="flex items-start mb-4">
                <div className="flex-shrink-0 bg-red-100 rounded-full p-2">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">File Error</h3>
                  <p className="mt-2 text-sm text-gray-500 leading-relaxed">{errorModalMessage}</p>
                </div>
              </div>
              <div className="mt-5 flex justify-end">
                <button
                  type="button"
                  onClick={closeErrorModal}
                  className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Header with request details */}
        <div className="bg-primary-600 p-4 sm:p-6 text-white">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2 sm:mb-3">File Upload Requested</h1>
          {requestDetails ? (
            <>
              <p className="text-primary-100 mb-3 sm:mb-4 text-sm sm:text-base leading-relaxed">{requestDetails.description}</p>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                {requestDetails.deadline && (
                  <div className="inline-flex items-center bg-primary-700 px-3 py-2 rounded-md text-xs sm:text-sm">
                    <svg className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Due by: {new Date(requestDetails.deadline).toLocaleDateString()}
                  </div>
                )}
                <div className="inline-flex items-center bg-primary-700 px-3 py-2 rounded-md text-xs sm:text-sm">
                  <svg className="h-4 w-4 mr-1.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Expires: {new Date(requestDetails.expires_at).toLocaleDateString()}
                </div>
              </div>
            </>
          ) : (
            <p className="text-primary-100 mb-3 text-sm sm:text-base">Please upload your files for this request.</p>
          )}
        </div>

        <div className="p-4 sm:p-6 lg:p-8">
          {/* Success and error messages */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 sm:px-6 py-4 rounded-lg sm:rounded-xl mb-6">
              <div className="flex items-start">
                <svg className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-green-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <div>
                  <h3 className="font-medium text-sm sm:text-base">Success!</h3>
                  <p className="text-xs sm:text-sm mt-1">Your files have been uploaded successfully. Thank you!</p>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg sm:rounded-xl mb-4 sm:mb-6 text-sm sm:text-base">
              {error}
            </div>
          )}

          {/* Drag and Drop area */}
          <div
            className={`border-2 border-dashed rounded-lg sm:rounded-xl p-6 sm:p-8 lg:p-12 mb-6 text-center cursor-pointer transition-all duration-200 ${
              dragActive 
                ? 'border-primary-500 bg-primary-50' 
                : selectedFiles.length 
                  ? 'border-green-400 bg-green-50' 
                  : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
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
              onChange={handleFileChange}
              className="hidden"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.svg,.webp,.zip,.rar,.json,.html,.csv"
            />
            
            <div className="space-y-3 sm:space-y-4">
              <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <div>
                <p className="text-base sm:text-lg font-medium text-gray-900 mb-1 sm:mb-2">
                  {dragActive ? 'Drop files here' : 'Drag and drop files here'}
                </p>
                <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">
                  or <span className="text-primary-600 font-medium">click to browse</span>
                </p>
                <p className="text-xs sm:text-sm text-gray-500">
                  Maximum file size: 50MB per file
                </p>
              </div>
            </div>
          </div>

          {/* Selected Files List */}
          {selectedFiles.length > 0 && (
            <div className="mb-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
                <h3 className="text-base sm:text-lg font-medium text-gray-900">
                  Selected Files ({selectedFiles.length})
                </h3>
                <button
                  onClick={handleClearAllFiles}
                  className="text-sm text-red-600 hover:text-red-800 font-medium transition-colors self-start sm:self-auto"
                >
                  Clear All
                </button>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center min-w-0 flex-1">
                      <span className="text-lg sm:text-xl mr-2 sm:mr-3 flex-shrink-0">
                        {getFileIcon(file.type)}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="ml-3 p-1 text-red-600 hover:text-red-800 transition-colors flex-shrink-0"
                      title="Remove file"
                    >
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Progress */}
          {uploading && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm sm:text-base font-medium text-gray-700">Uploading...</span>
                <span className="text-sm sm:text-base text-gray-600">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 sm:h-3">
                <div 
                  className="bg-primary-600 h-2 sm:h-3 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={selectedFiles.length === 0 || uploading}
            className={`w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              selectedFiles.length === 0 || uploading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg focus:ring-primary-500'
            }`}
          >
            {uploading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Uploading Files...
              </span>
            ) : (
              `Upload ${selectedFiles.length} File${selectedFiles.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadPage; 