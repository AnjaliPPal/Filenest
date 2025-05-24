import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getUserRequests, getRequestFiles, downloadAllFiles } from '../services/api';
import { FileRequest, UploadedFile } from '../types';
import axios from 'axios';
import { API_CONFIG } from '../config/environment';
import { useIsMobile, useIsTablet } from '../hooks/useMediaQuery';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userEmail, user, isLoading: contextLoading } = useAppContext();
  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  
  const [requests, setRequests] = useState<FileRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedRequest, setExpandedRequest] = useState<string | null>(null);
  const [files, setFiles] = useState<{ [requestId: string]: UploadedFile[] }>({});
  const [downloadingRequestId, setDownloadingRequestId] = useState<string | null>(null);
  
  // Check if user is logged in
  useEffect(() => {
    if (!user && !userEmail && !contextLoading) {
      navigate('/login');
    }
  }, [user, userEmail, contextLoading, navigate]);
  
  // Main data fetching function
  const fetchRequests = useCallback(async (email: string, forceRefresh: boolean = false) => {
    if (!email) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Try the new context method first with direct response
      const directResponse = await getUserRequests(email);
      
      if (directResponse) {
        // Handle response from getUserRequests which might return just the array
        const responseData = Array.isArray(directResponse) ? directResponse : directResponse.requests || directResponse;
        
        setRequests(responseData);
        
        // Pre-load files state with files from requests
        const initialFiles: { [requestId: string]: UploadedFile[] } = {};
        responseData.forEach((request: FileRequest) => {
          if (request.uploaded_files && Array.isArray(request.uploaded_files)) {
            initialFiles[request.id] = request.uploaded_files;
          }
        });
        
        setFiles(initialFiles);
        
        setLoading(false);
        return;
      }
    } catch (error) {
      // If the new method fails, try the old method
      try {
        const response = await axios.get(`${API_CONFIG.BASE_URL}/requests/user/${email}`);
        const data = response.data;
        
        const requestsData = data.requests || [];
        setRequests(requestsData);
        
        // Pre-load files state with files from requests
        const initialFiles: { [requestId: string]: UploadedFile[] } = {};
        requestsData.forEach((request: FileRequest) => {
          if (request.uploaded_files && Array.isArray(request.uploaded_files)) {
            initialFiles[request.id] = request.uploaded_files;
          }
        });
        
        setFiles(initialFiles);
        
        setLoading(false);
        return;
      } catch (secondError) {
        setError('Failed to load your requests. Please try again.');
        setLoading(false);
      }
    }
  }, []);
  
  // Add fetchRequests effect after defining the function
  useEffect(() => {
    const email = user?.email || userEmail;
    if (email) {
      fetchRequests(email);
    }
  }, [userEmail, user, fetchRequests]);
  
  // Fetch files for a request when expanded
  const handleToggleRequest = async (requestId: string) => {
    if (expandedRequest === requestId) {
      setExpandedRequest(null);
      return;
    }
    
    setExpandedRequest(requestId);
    
    // Check if we already have files for this request
    if (files[requestId] && files[requestId].length > 0) {
      return; // Already have files, no need to fetch
    }
    
    // Find the request to check for embedded files
    const request = requests.find(r => r.id === requestId);
    
    if (request && request.uploaded_files && Array.isArray(request.uploaded_files) && request.uploaded_files.length > 0) {
      // Use embedded files if available
      const uploadedFiles = request.uploaded_files;
      const updated = { ...files, [requestId]: uploadedFiles };
      setFiles(updated);
    } else {
      // Fetch files from API
      try {
        const fileData = await getRequestFiles(requestId);
        const updated = { ...files, [requestId]: fileData };
        setFiles(updated);
      } catch (error) {
        console.error('Error fetching files:', error);
      }
    }
  };
  
  // Handle file download (all files for a request as a single ZIP)
  const handleDownloadAll = async (requestId: string) => {
    try {
      setDownloadingRequestId(requestId);
      
      // Get the current request details for a better filename
      const request = requests.find(req => req.id === requestId);
      const filenameBase = request?.description
        ? request.description.replace(/[^a-z0-9]/gi, '_').substring(0, 30)
        : `request_${requestId.substring(0, 8)}`;
      
      // Request a ZIP file containing all files for this request
      const response = await axios.get(`${API_CONFIG.BASE_URL}/files/download-zip/${requestId}`, {
        responseType: 'blob'
      });
      
      // Create a download from the blob response
      const blob = new Blob([response.data], { type: 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filenameBase}_files.zip`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      setDownloadingRequestId(null);
    } catch (err) {
      console.error('Failed to download ZIP file:', err);
      setError('Failed to download files. Please try again.');
      setDownloadingRequestId(null);
    }
  };
  
  // Download a single file
  const handleDownloadFile = async (fileId: string, filename: string) => {
    try {
      // Get download URL from backend
      const response = await axios.get(`${API_CONFIG.BASE_URL}/downloads/${fileId}`);
      
      // Create a temporary link and click it to download
      const downloadUrl = response.data.url;
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download file. Please try again.');
    }
  };
  
  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  // Get status badge class based on status
  const getStatusBadgeClass = (status: string, expiresAt: string) => {
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    
    if (now > expiryDate) {
      return 'bg-gray-500 text-white';
    }
    
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status display text
  const getStatusText = (status: string, expiresAt: string) => {
    const now = new Date();
    const expiryDate = new Date(expiresAt);
    
    if (now > expiryDate) {
      return 'Expired';
    }
    
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Copy link to clipboard
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  if (contextLoading || (!user && !userEmail)) {
    return null; // Don't render anything while redirecting
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Your File Requests</h1>
        <button
          onClick={() => navigate('/')}
          className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm sm:text-base font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
        >
          Create New Request
        </button>
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-100 rounded-lg text-red-700 text-sm sm:text-base">
          {error}
        </div>
      )}
      
      {/* Empty State */}
      {requests.length === 0 ? (
        <div className="text-center py-12 sm:py-16 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-4 text-lg sm:text-xl font-medium text-gray-900">No file requests yet</h3>
          <p className="mt-2 text-sm sm:text-base text-gray-500">Get started by creating your first file request.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 sm:px-6 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Create Request
            </button>
          </div>
        </div>
      ) : (
        /* Requests List */
        <div className="space-y-4 sm:space-y-6">
          {requests.map((request) => (
            <div key={request.id} className="bg-white rounded-lg sm:rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200">
              {/* Request Header */}
              <div className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                      <h3 className="text-base sm:text-lg font-medium text-gray-900 truncate">
                        {request.description}
                      </h3>
                      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(request.status, request.expires_at)}`}>
                        {getStatusText(request.status, request.expires_at)}
                      </div>
                    </div>
                    
                    {/* Request Details */}
                    <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500">
                        <div className="flex items-center">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {request.deadline ? (
                            <>Deadline: {formatDate(request.deadline)}</>
                          ) : (
                            <>No deadline</>
                          )}
                        </div>
                        <div className="flex items-center">
                          <svg className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Expires: {formatDate(request.expires_at)}
                        </div>
                      </div>
                      
                      {/* Share Link */}
                      <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-500">
                        <svg className="flex-shrink-0 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                        <span className="truncate flex-1">
                          {`${window.location.origin}/upload/${request.unique_link}`}
                        </span>
                        <button
                          onClick={() => copyToClipboard(`${window.location.origin}/upload/${request.unique_link}`)}
                          className="flex-shrink-0 p-1 text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded"
                          title="Copy link"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Button */}
                  <div className="flex-shrink-0">
                    <button
                      onClick={() => handleToggleRequest(request.id)}
                      className="w-full sm:w-auto px-3 py-2 text-sm font-medium text-gray-700 hover:text-primary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md border border-gray-300 hover:border-primary-300 transition-colors"
                    >
                      {expandedRequest === request.id ? 'Hide Details' : 'Show Details'}
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Expanded Files Section */}
              {expandedRequest === request.id && (
                <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-6">
                  <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                    <h4 className="text-base sm:text-lg font-medium text-gray-900">
                      Files {files[request.id] ? `(${files[request.id].length})` : ''}
                    </h4>
                    {(files[request.id]?.length > 0) && (
                      <button
                        onClick={() => handleDownloadAll(request.id)}
                        disabled={downloadingRequestId === request.id}
                        className={`w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                          downloadingRequestId === request.id
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-primary-600 text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
                        }`}
                      >
                        {downloadingRequestId === request.id ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Downloading...
                          </span>
                        ) : (
                          'Download All'
                        )}
                      </button>
                    )}
                  </div>
                  
                  {/* Files List */}
                  {!files[request.id] ? (
                    <div className="flex justify-center items-center h-20">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
                    </div>
                  ) : files[request.id].length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm sm:text-base">
                      No files have been uploaded yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {files[request.id].map((file) => (
                        <div key={file.id} className="bg-white rounded-lg p-3 sm:p-4 border border-gray-200">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="flex-shrink-0 w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                                  <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                  </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm sm:text-base font-medium text-gray-900 truncate">
                                    {file.filename}
                                  </p>
                                  <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs sm:text-sm text-gray-500">
                                    <span>
                                      {file.file_size 
                                        ? `${Math.round(file.file_size / 1024)} KB` 
                                        : 'Unknown size'}
                                    </span>
                                    <span>
                                      {formatDate(file.uploaded_at)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleDownloadFile(file.id, file.filename)}
                              className="w-full sm:w-auto px-3 py-2 text-sm font-medium text-primary-600 hover:text-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-md border border-primary-200 hover:border-primary-300 transition-colors"
                            >
                              Download
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dashboard; 