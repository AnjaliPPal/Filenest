import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <span className="font-bold text-xl text-white">
              File<span className="text-blue-400">Nest</span>
            </span>
            <p className="text-sm mt-1">Secure file requests and uploads made simple.</p>
          </div>
          <div className="flex flex-col items-center md:items-end">
            <p className="text-sm">
              © {new Date().getFullYear()} FileNest. All rights reserved.
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Powered by <span className="font-medium text-blue-400">FileNest</span>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 