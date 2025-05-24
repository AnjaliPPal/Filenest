import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useIsMobile } from '../hooks/useMediaQuery';

const Navbar: React.FC = () => {
  const { authUser, isAuthenticated, logout } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false); // Close mobile menu
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  return (
    <nav className="bg-white shadow-sm fixed w-full z-50 border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link 
                to="/" 
                className="text-xl sm:text-2xl font-bold text-primary-600 hover:text-primary-700 transition-colors duration-200"
                onClick={closeMobileMenu}
              >
                FileNest
              </Link>
            </div>
            
            {/* Desktop navigation */}
            <div className="hidden md:ml-8 md:flex md:space-x-6">
              <Link
                to="/"
                className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-gray-50"
              >
                Home
              </Link>
              {isAuthenticated && authUser && (
                <Link
                  to="/dashboard"
                  className="text-gray-600 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 hover:bg-gray-50"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>

          {/* Desktop auth section */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            {isAuthenticated && authUser ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                    <span className="text-primary-700 text-sm font-semibold">
                      {authUser.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 max-w-32 truncate">
                    {authUser.email}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="bg-white border border-gray-300 rounded-lg py-2 px-4 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-primary-600 border border-primary-600 rounded-lg py-2 px-4 text-sm font-medium text-white hover:bg-primary-700 hover:border-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
              >
                Sign in
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-white inline-flex items-center justify-center p-2 rounded-lg text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-all duration-200"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {/* Hamburger icon */}
              <svg
                className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
              {/* Close icon */}
              <svg
                className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:hidden bg-white border-t border-gray-100 shadow-lg`}>
        <div className="px-4 pt-4 pb-6 space-y-3">
          {/* Navigation links */}
          <div className="space-y-2">
            <Link
              to="/"
              className="text-gray-600 hover:text-primary-600 hover:bg-gray-50 block px-3 py-3 rounded-lg text-base font-medium transition-all duration-200"
              onClick={closeMobileMenu}
            >
              Home
            </Link>
            {isAuthenticated && authUser && (
              <Link
                to="/dashboard"
                className="text-gray-600 hover:text-primary-600 hover:bg-gray-50 block px-3 py-3 rounded-lg text-base font-medium transition-all duration-200"
                onClick={closeMobileMenu}
              >
                Dashboard
              </Link>
            )}
          </div>
          
          {/* Auth section */}
          <div className="pt-4 border-t border-gray-100">
            {isAuthenticated && authUser ? (
              <div className="space-y-4">
                {/* User info */}
                <div className="flex items-center px-3 py-2 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-700 text-sm font-semibold">
                      {authUser.email?.[0]?.toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div className="ml-3 min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {authUser.email}
                    </p>
                    <p className="text-xs text-gray-500">Authenticated</p>
                  </div>
                </div>
                
                {/* Sign out button */}
                <button
                  onClick={handleLogout}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-lg transition-all duration-200 text-center"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="block w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-all duration-200 text-center"
                onClick={closeMobileMenu}
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 