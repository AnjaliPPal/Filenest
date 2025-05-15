import React, { useState, useEffect, useRef } from 'react';
import { useMediaQuery, breakpoints } from '../hooks/useMediaQuery';

interface ShareLinkProps {
  link: string;
  onCreateAnother: () => void;
}

const ShareLink: React.FC<ShareLinkProps> = ({ link, onCreateAnother }) => {
  const [copied, setCopied] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isMobile = !useMediaQuery(breakpoints.md);

  // Auto-select the link when component mounts
  useEffect(() => {
    if (inputRef.current && !isMobile) {
      inputRef.current.select();
    }
  }, [isMobile]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(link)
      .then(() => {
        setCopied(true);
        setShowTooltip(true);
        
        // Hide tooltip after 2 seconds
        setTimeout(() => {
          setShowTooltip(false);
          setTimeout(() => setCopied(false), 300); // wait for animation
        }, 2000);
      })
      .catch(err => {
        console.error('Could not copy text: ', err);
        // Fallback to select and copy
        if (inputRef.current) {
          inputRef.current.select();
          document.execCommand('copy');
          setCopied(true);
          setShowTooltip(true);
          
          setTimeout(() => {
            setShowTooltip(false);
            setTimeout(() => setCopied(false), 300);
          }, 2000);
        }
      });
  };

  const getShareText = () => `Please upload your files using this link: ${link}`;

  return (
    <div className="w-full">
      <div 
        className="bg-green-50 border border-green-100 rounded-lg p-4 mb-6 flex items-center"
        role="alert"
        aria-live="polite"
      >
        <div className="mr-3 flex-shrink-0">
          <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-grow">
          <h3 className="text-green-800 font-medium">Success!</h3>
          <p className="text-green-700 text-sm">Your file request has been created. Share the link below.</p>
        </div>
      </div>
      
      <div className="mb-6">
        <h3 className="text-gray-700 font-medium mb-2">Share this link with your client</h3>
        <div className="relative">
          <div className="flex">
            <input
              ref={inputRef}
              type="text"
              value={link}
              readOnly
              aria-label="Generated file request link"
              className="flex-grow px-3 py-3 border border-gray-300 rounded-l-lg bg-gray-50 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <button
              onClick={handleCopyLink}
              aria-label="Copy link"
              className={`relative px-4 py-3 font-medium rounded-r-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                copied 
                  ? 'bg-green-600 text-white focus:ring-green-500' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              }`}
            >
              {copied ? (
                <span className="flex items-center">
                  <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Copied
                </span>
              ) : (
                <span className="flex items-center">
                  <svg className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  Copy
                </span>
              )}
              
              {showTooltip && (
                <span className="animate-fade-in-out absolute -top-10 left-1/2 transform -translate-x-1/2 px-3 py-1 text-xs font-medium text-white bg-gray-900 rounded">
                  Copied to clipboard!
                  <span className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px border-4 border-transparent border-t-gray-900"></span>
                </span>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <h3 className="text-gray-700 font-medium mb-3">Share via</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <a
            href={`mailto:?subject=File Upload Request&body=${encodeURIComponent(`I've created a secure file upload request for you. ${getShareText()}`)}`}
            className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            aria-label="Share via email"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 mb-1" viewBox="0 0 20 20" fill="currentColor">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Email</span>
          </a>
          <a
            href={`https://wa.me/?text=${encodeURIComponent(getShareText())}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            aria-label="Share via WhatsApp"
          >
            <svg className="h-6 w-6 text-gray-700 mb-1" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">WhatsApp</span>
          </a>
          <a
            href={`sms:?&body=${encodeURIComponent(getShareText())}`}
            className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors"
            aria-label="Share via SMS"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 mb-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            <span className="text-xs font-medium text-gray-700">SMS</span>
          </a>
          <a
            onClick={(e) => {
              e.preventDefault();
              handleCopyLink();
            }}
            href="#"
            className="flex flex-col items-center justify-center p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors cursor-pointer"
            aria-label="Copy link"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Copy Link</span>
          </a>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-5">
        <button
          onClick={onCreateAnother}
          className="w-full py-3 px-4 bg-white border border-blue-600 text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="Create another file request"
        >
          Create Another Request
        </button>
      </div>
    </div>
  );
};

export default ShareLink;

// Add this to your CSS (in index.css or a dedicated animations.css file)
// @keyframes fadeInOut {
//   0% { opacity: 0; }
//   15% { opacity: 1; }
//   85% { opacity: 1; }
//   100% { opacity: 0; }
// }
// 
// .animate-fade-in-out {
//   animation: fadeInOut 2s ease-in-out;
// } 