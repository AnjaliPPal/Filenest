import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { getUserRequests, getRequestFiles, downloadAllFiles } from '../services/api';
import { FileRequest, UploadedFile } from '../types';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { userEmail, user, isLoading: contextLoading } = useAppContext();
  
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
  
  // Fetch all requests for the user
  useEffect(() => {
    const fetchRequests = async () => {
      if (!userEmail && !user?.email) return;
      
      try {
        setLoading(true);
        const email = user?.email || userEmail;
        if (!email) return;
        
        const data = await getUserRequests(email);
        setRequests(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to load requests:', err);
        setError('Failed to load your file requests. Please try again.');
        setLoading(false);
      }
    };
    
    fetchRequests();
  }, [userEmail, user]);
  
  // Fetch files for a request when expanded
  const handleToggleRequest = async (requestId: string) => {
    if (expandedRequest === requestId) {
      setExpandedRequest(null);
      return;
    }
    
    setExpandedRequest(requestId);
    
    if (!files[requestId]) {
      try {
        const fileData = await getRequestFiles(requestId);
        console.log('Fetched files for request:', requestId, fileData); // Log the fetched files
        setFiles(prev => ({
          ...prev,
          [requestId]: fileData
        }));
      } catch (err) {
        console.error(`Failed to load files for request ${requestId}:`, err);
      }
    }
  };
  
  // Handle file download (all files for a request)
  const handleDownloadAll = async (requestId: string) => {
    try {
      setDownloadingRequestId(requestId);
      const downloadUrls = await downloadAllFiles(requestId);
      
      // For each URL, create a download link and click it
      downloadUrls.forEach(item => {
        if (item.download_url) {
          const link = document.createElement('a');
          link.href = item.download_url;
          link.setAttribute('download', item.filename || 'download');
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      });
      
      setDownloadingRequestId(null);
    } catch (err) {
      console.error('Failed to download files:', err);
      setDownloadingRequestId(null);
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
  
  if (contextLoading || (!user && !userEmail)) {
    return null; // Don't render anything while redirecting
  }
  
  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Your File Requests</h1>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New Request
        </button>
      </div>
      
      {error && (
        <div className="p-4 mb-6 bg-red-50 border border-red-100 rounded-lg text-red-700">
          {error}
        </div>
      )}
      
      {requests.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No file requests yet</h3>
          <p className="mt-1 text-gray-500">Get started by creating your first file request.</p>
          <div className="mt-6">
            <button
              onClick={() => navigate('/')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Create Request
            </button>
          </div>
        </div>
      ) : 
      
      (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {requests.map((request) => (
              <li key={request.id}>
                <div className="block hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {request.description}
                        </p>
                        <div className={`ml-2 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(request.status, request.expires_at)}`}>
                          {getStatusText(request.status, request.expires_at)}
                        </div>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex">
                        <button
                          onClick={() => handleToggleRequest(request.id)}
                          className="ml-2 px-3 py-1 text-sm text-gray-700 hover:text-blue-600 focus:outline-none"
                        >
                          {expandedRequest === request.id ? 'Hide Details' : 'Show Details'}
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="flex items-center text-sm text-gray-500">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {request.deadline ? (
                            <>Deadline: {formatDate(request.deadline)}</>
                          ) : (
                            <>No deadline</>
                          )}
                        </p>
                        <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          Expires: {formatDate(request.expires_at)}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                        </svg>
                        Link: {`${window.location.origin}/upload/${request.unique_link}`}
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/upload/${request.unique_link}`);
                          }}
                          className="ml-1 text-blue-600 hover:text-blue-800"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded file list */}
                  {expandedRequest === request.id && (
                    console.log(files[request.id]),
  
                    <div className="border-t border-gray-200 px-4 py-5 sm:px-6 bg-gray-50">
                      <div className="mb-4 flex justify-between items-center">
                        <h3 className="text-lg leading-6 font-medium text-gray-900">
                          Files
                        </h3>
                        {(files[request.id]?.length > 0) && (
                          <button
                            onClick={() => handleDownloadAll(request.id)}
                            disabled={downloadingRequestId === request.id}
                            className={`px-3 py-1 text-sm rounded-md ${
                              downloadingRequestId === request.id
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                          >
                            {downloadingRequestId === request.id ? (
                              <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline-block" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Downloading...
                              </>
                            ) : (
                              <>Download All</>
                            )}
                          </button>
                        )}
                      </div>
                      
                      {!files[request.id] ? (
                        <div className="flex justify-center items-center h-20">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                        </div>
                      ) : files[request.id].length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          No files have been uploaded yet.
                        </div>
                      ) : (
                        <div className="mt-2 flow-root">
                          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                              <table className="min-w-full divide-y divide-gray-300">
                                <thead>
                                  <tr>
                                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                                      Filename
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                      Size
                                    </th>
                                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                      Uploaded At
                                    </th>
                                    <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-0">
                                      <span className="sr-only">Download</span>
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                  {files[request.id].map((file) => (
                                    <tr key={file.id}>
                                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                                        {file.filename}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {file.file_size 
                                          ? `${Math.round(file.file_size / 1024)} KB` 
                                          : 'Unknown size'}
                                      </td>
                                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                        {formatDate(file.uploaded_at)}
                                      </td>
                                      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-0">
                                        <button
                                          className="text-blue-600 hover:text-blue-900"
                                          // Individual file download would go here
                                        >
                                          Download
                                        </button>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Dashboard; 