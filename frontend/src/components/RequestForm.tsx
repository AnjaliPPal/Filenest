import React, { useState, useEffect } from 'react';
import { CreateRequestInput } from '../types';
import ShareLink from './ShareLink';
import { useAppContext } from '../context/AppContext';

const RequestForm: React.FC = () => {
  const { userEmail, createRequest, error, clearError } = useAppContext();
  
  const [formData, setFormData] = useState<CreateRequestInput>({
    email: userEmail || '',
    description: '',
    deadline: '',
    expiry_days: 7
  });
  
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof CreateRequestInput, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requestLink, setRequestLink] = useState<string | null>(null);

  // Update email field if userEmail changes
  useEffect(() => {
    if (userEmail && !formData.email) {
      setFormData(prev => ({ ...prev, email: userEmail }));
    }
  }, [userEmail, formData.email]);

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
    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
      isValid = false;
    }

    // Description validation
    if (!formData.description) {
      newErrors.description = 'Description is required';
      isValid = false;
    } else if (formData.description.length < 5) {
      newErrors.description = 'Description must be at least 5 characters';
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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    clearError();

    try {
      const result = await createRequest(formData);
      
      if (result.success && result.link) {
        setRequestLink(result.link);
        
        // Reset form for next submission
        setFormData({
          email: userEmail || '',
          description: '',
          deadline: '',
          expiry_days: 7
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateAnother = () => {
    setRequestLink(null);
  };

  if (requestLink) {
    return <ShareLink link={requestLink} onCreateAnother={handleCreateAnother} />;
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} aria-label="Create file request form" noValidate className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Your Email <span className="text-red-500">*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
              validationErrors.email 
                ? 'border-red-300 text-red-600 focus:ring-red-100 focus:border-red-400' 
                : 'border-gray-300 focus:ring-blue-100 focus:border-blue-400'
            }`}
            placeholder="email@example.com"
            aria-invalid={!!validationErrors.email}
            aria-describedby={validationErrors.email ? "email-error" : undefined}
            required
          />
          {validationErrors.email && (
            <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
              {validationErrors.email}
            </p>
          )}
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
              validationErrors.description 
                ? 'border-red-300 text-red-600 focus:ring-red-100 focus:border-red-400' 
                : 'border-gray-300 focus:ring-blue-100 focus:border-blue-400'
            }`}
            placeholder="Please upload the files I need..."
            aria-invalid={!!validationErrors.description}
            aria-describedby={validationErrors.description ? "desc-error" : undefined}
            required
          />
          {validationErrors.description && (
            <p id="desc-error" className="mt-1 text-sm text-red-600" role="alert">
              {validationErrors.description}
            </p>
          )}
          <p className="text-xs text-gray-500 mt-1">Be specific about what files you need and why.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
              Deadline (Optional)
            </label>
            <input
              type="date"
              id="deadline"
              name="deadline"
              value={formData.deadline}
              onChange={handleChange}
              className={`w-full px-3 py-2 bg-white border rounded-lg focus:ring-2 focus:outline-none transition-colors ${
                validationErrors.deadline 
                  ? 'border-red-300 text-red-600 focus:ring-red-100 focus:border-red-400' 
                  : 'border-gray-300 focus:ring-blue-100 focus:border-blue-400'
              }`}
              aria-invalid={!!validationErrors.deadline}
              aria-describedby={validationErrors.deadline ? "deadline-error" : undefined}
            />
            {validationErrors.deadline && (
              <p id="deadline-error" className="mt-1 text-sm text-red-600" role="alert">
                {validationErrors.deadline}
              </p>
            )}
          </div>
          
          <div>
            <label htmlFor="expiry_days" className="block text-sm font-medium text-gray-700 mb-1">
              Link Expires After
            </label>
            <select
              id="expiry_days"
              name="expiry_days"
              value={formData.expiry_days}
              onChange={handleChange}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 focus:outline-none transition-colors"
            >
              <option value={1}>1 day</option>
              <option value={3}>3 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">For security, links automatically expire.</p>
          </div>
        </div>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full py-3 mt-2 rounded-lg font-medium transition-all duration-200 ${
            isSubmitting 
              ? 'bg-blue-400 text-white cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-lg active:bg-blue-800'
          }`}
          aria-busy={isSubmitting}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating...
            </span>
          ) : (
            'Generate Request Link'
          )}
        </button>
      </form>
    </div>
  );
};

export default RequestForm; 