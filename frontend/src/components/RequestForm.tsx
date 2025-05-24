import React, { useState, useEffect } from 'react';
import { CreateRequestInput } from '../types';
import ShareLink from './ShareLink';
import { useAppContext } from '../context/AppContext';
import { Link, useNavigate } from 'react-router-dom';

const RequestForm: React.FC = () => {
  const { userEmail, createRequest, error, clearError, isAuthenticated, authUser } = useAppContext();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState<CreateRequestInput>({
    recipientEmail: isAuthenticated && userEmail ? userEmail : '',
    description: '',
    deadline: '',
    expiry_days: 7
  });
  
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof CreateRequestInput, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestLink, setRequestLink] = useState<string | null>(null);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [showAuthRequired, setShowAuthRequired] = useState(false);

  // Update email field if userEmail changes and user is authenticated
  useEffect(() => {
    if (isAuthenticated && userEmail && !formData.recipientEmail) {
      setFormData(prev => ({ ...prev, recipientEmail: userEmail }));
    }
  }, [isAuthenticated, userEmail, formData.recipientEmail]);

  // Clear context error when component unmounts
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateRequestInput, string>> = {};
    let isValid = true;

    // Email validation
    if (!formData.recipientEmail) {
      newErrors.recipientEmail = 'Email is required';
      isValid = false;
    } else if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(formData.recipientEmail)) {
      newErrors.recipientEmail = 'Please enter a valid email address';
      isValid = false;
    }

    // Description validation
    if (!formData.description) {
      newErrors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
      isValid = false;
    } else if (formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters';
      isValid = false;
    }

    // Deadline validation (if provided)
    if (formData.deadline) {
      const deadlineDate = new Date(formData.deadline);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (deadlineDate < today) {
        newErrors.deadline = 'Deadline cannot be in the past';
        isValid = false;
      }
    }

    setValidationErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'expiry_days' ? parseInt(value, 10) : value
    }));
    
    // Clear validation error when user types
    if (validationErrors[name as keyof CreateRequestInput]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
    
    // Clear network error when user makes changes
    if (networkError) {
      setNetworkError(null);
    }
    
    // Hide auth required message when user is editing
    if (showAuthRequired) {
      setShowAuthRequired(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNetworkError(null);
    
    // Check if user is authenticated first
    if (!isAuthenticated) {
      setShowAuthRequired(true);
      return;
    }
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const result = await createRequest(formData);
      
      if (result.success && result.link) {
        setRequestLink(result.link);
        
        // Reset form for next submission but keep email if authenticated
        setFormData({
          recipientEmail: isAuthenticated && userEmail ? userEmail : '',
          description: '',
          deadline: '',
          expiry_days: 7
        });
        setValidationErrors({});
      } else if (result.error) {
        setNetworkError(result.error);
      }
    } catch (err) {
      setNetworkError(
        err instanceof Error 
          ? err.message 
          : "Failed to create request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleLoginRedirect = () => {
    // Save current path and redirect to login
    navigate('/login?returnUrl=/request');
  };

  const handleCreateAnother = () => {
    setRequestLink(null);
  };

  if (requestLink) {
    return <ShareLink link={requestLink} onCreateAnother={handleCreateAnother} />;
  }

  return (
    <div className="w-full">
      {/* Authentication Info Banner */}
      {!isAuthenticated && (
        <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-blue-50 text-blue-700 border border-blue-100 rounded-lg sm:rounded-xl text-sm sm:text-base">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="leading-relaxed">
                <Link to="/login?returnUrl=/request" className="font-medium text-blue-700 underline hover:text-blue-800 transition-colors">
                  Login or sign up
                </Link> to save your email and easily manage your file requests.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Required Warning */}
      {showAuthRequired && (
        <div className="mb-4 sm:mb-6 p-4 bg-yellow-50 border border-yellow-100 rounded-lg sm:rounded-xl">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Authentication Required</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>You must be logged in to create file request links.</p>
                <button 
                  onClick={handleLoginRedirect}
                  className="mt-3 inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition-colors"
                >
                  Sign in now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} aria-label="Create file request form" noValidate className="space-y-4 sm:space-y-6">
        {/* Context Error */}
        {error && (
          <div className="p-3 sm:p-4 bg-red-50 text-red-600 border border-red-100 rounded-lg sm:rounded-xl text-sm sm:text-base">
            {error}
          </div>
        )}
        
        {/* Network Error */}
        {networkError && (
          <div className="p-3 sm:p-4 bg-red-50 text-red-600 border border-red-100 rounded-lg sm:rounded-xl text-sm sm:text-base">
            {networkError}
            <button 
              type="button" 
              className="ml-2 text-red-800 font-medium hover:text-red-900 transition-colors"
              onClick={() => setNetworkError(null)}
            >
              Dismiss
            </button>
          </div>
        )}
        
        {/* Email Field */}
        <div>
          <label htmlFor="recipientEmail" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
            Your Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="recipientEmail"
            name="recipientEmail"
            value={formData.recipientEmail}
            onChange={handleChange}
            className={`form-input w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border rounded-lg sm:rounded-xl focus:ring-2 focus:outline-none transition-all duration-200 text-sm sm:text-base ${
              validationErrors.recipientEmail 
                ? 'border-red-300 text-red-600 focus:ring-red-100 focus:border-red-400' 
                : 'border-gray-300 focus:ring-primary-100 focus:border-primary-400'
            }`}
            placeholder="email@example.com"
            aria-invalid={!!validationErrors.recipientEmail}
            aria-describedby={validationErrors.recipientEmail ? "email-error" : undefined}
            required
          />
          {validationErrors.recipientEmail && (
            <p id="email-error" className="mt-2 text-sm text-red-600" role="alert">
              {validationErrors.recipientEmail}
            </p>
          )}
        </div>
        
        {/* Description Field */}
        <div>
          <label htmlFor="description" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className={`form-textarea w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border rounded-lg sm:rounded-xl focus:ring-2 focus:outline-none transition-all duration-200 text-sm sm:text-base resize-none ${
              validationErrors.description 
                ? 'border-red-300 text-red-600 focus:ring-red-100 focus:border-red-400' 
                : 'border-gray-300 focus:ring-primary-100 focus:border-primary-400'
            }`}
            placeholder="Please upload the files I need..."
            aria-invalid={!!validationErrors.description}
            aria-describedby={validationErrors.description ? "desc-error" : undefined}
            required
            maxLength={500}
          />
          {validationErrors.description && (
            <p id="desc-error" className="mt-2 text-sm text-red-600" role="alert">
              {validationErrors.description}
            </p>
          )}
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs sm:text-sm text-gray-500">Be specific about what files you need and why.</p>
            <p className="text-xs sm:text-sm text-gray-400">{formData.description.length}/500</p>
          </div>
        </div>
        
        {/* Deadline and Expiry Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div>
            <label htmlFor="deadline" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
              Deadline (Optional)
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className={`form-input w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border rounded-lg sm:rounded-xl focus:ring-2 focus:outline-none transition-all duration-200 text-sm sm:text-base ${
                validationErrors.deadline 
                  ? 'border-red-300 text-red-600 focus:ring-red-100 focus:border-red-400' 
                  : 'border-gray-300 focus:ring-primary-100 focus:border-primary-400'
              }`}
              aria-invalid={!!validationErrors.deadline}
              aria-describedby={validationErrors.deadline ? "deadline-error" : undefined}
              min={new Date().toISOString().split('T')[0]} // Set min to today's date
            />
            {validationErrors.deadline && (
              <p id="deadline-error" className="mt-2 text-sm text-red-600" role="alert">
                {validationErrors.deadline}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="expiry_days" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
              Link Expires After
            </label>
            <select
              id="expiry_days"
              name="expiry_days"
              value={formData.expiry_days}
              onChange={handleChange}
              className="form-select w-full px-3 sm:px-4 py-2 sm:py-3 bg-white border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-400 focus:outline-none transition-all duration-200 text-sm sm:text-base"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
            <p className="text-xs sm:text-sm text-gray-500 mt-2">For security, links automatically expire.</p>
          </div>
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 sm:py-4 mt-4 sm:mt-6 rounded-lg sm:rounded-xl font-medium text-sm sm:text-base transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isSubmitting 
              ? 'bg-primary-400 text-white cursor-not-allowed' 
              : isAuthenticated 
                ? 'bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg active:bg-primary-800 focus:ring-primary-500'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : (
            isAuthenticated ? 'Generate Request Link' : 'Sign in to Generate Link'
          )}
        </button>
      </form>
    </div>
  );
};

export default RequestForm; 