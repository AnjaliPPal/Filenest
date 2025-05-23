import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

const Navbar: React.FC = () => {
  const { authUser, isAuthenticated, logout } = useAppContext();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white shadow-sm fixed w-full z-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                FileNest
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              <Link
                to="/"
                className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
              >
                Home
              </Link>
              {isAuthenticated && authUser && (
                <Link
                  to="/dashboard"
                  className="border-transparent text-gray-500 hover:border-blue-500 hover:text-blue-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium"
                >
                  Dashboard
                </Link>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {isAuthenticated && authUser ? (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-700">{authUser.email}</span>
                <button
                  onClick={handleLogout}
                  className="bg-white border border-gray-300 rounded-md py-1.5 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-blue-600 border border-transparent rounded-md py-1.5 px-3 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign in
              </Link>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-white inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            >
              <span className="sr-only">Open main menu</span>
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

      <div className={`${isOpen ? 'block' : 'hidden'} sm:hidden`}>
        <div className="pt-2 pb-3 space-y-1">
          <Link
            to="/"
            className="bg-white border-transparent text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          {isAuthenticated && authUser && (
            <Link
              to="/dashboard"
              className="bg-white border-transparent text-gray-500 hover:bg-gray-50 hover:border-blue-500 hover:text-blue-700 block pl-3 pr-4 py-2 border-l-4 text-base font-medium"
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
          )}
        </div>
        <div className="pt-4 pb-3 border-t border-gray-200">
          {isAuthenticated && authUser ? (
            <div className="flex items-center px-4">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-600 text-xs font-medium">
                    {authUser.email?.[0]?.toUpperCase() || 'U'}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {authUser.email}
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="ml-auto bg-white flex-shrink-0 p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="px-4">
              <Link
                to="/login"
                className="block text-center w-full bg-blue-600 border border-transparent rounded-md py-2 px-4 text-sm font-medium text-white hover:bg-blue-700"
                onClick={() => setIsOpen(false)}
              >
                Sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 