import React, { useEffect, useState, memo } from 'react';
import { BrowserRouter, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Navbar from './components/Navbar';
import { AppProvider, useAppContext } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalLoadingIndicator from './components/GlobalLoadingIndicator';
import UploadPage from './components/UploadPage';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import Footer from './components/Footer';
import SubscriptionPlans from './components/SubscriptionPlans';
import SubscriptionSuccess from './pages/SubscriptionSuccess';
import SubscriptionCancel from './pages/SubscriptionCancel';
import AuthDiagnostics from './components/AuthDiagnostics';
import { auth } from './config/firebase';

// Simplified protected route to eliminate potential startup issues
const ProtectedRoute: React.FC<{ element: React.ReactNode }> = ({ element }) => {
  const { isAuthenticated, isLoading } = useAppContext();
  const location = useLocation();
  
  // Show loading state if still determining authentication
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh] p-4">
        <div className="animate-pulse flex flex-col items-center space-y-4">
          <div className="h-12 w-12 bg-primary-200 rounded-full"></div>
          <div className="text-primary-600 text-sm sm:text-base font-medium">
            Verifying authentication...
          </div>
        </div>
      </div>
    );
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  
  // Render the protected content
  return <>{element}</>;
};

// Helper component to use hooks outside Router, memoized to prevent unnecessary re-renders
const AppContent = memo(() => {
  const location = useLocation();
  const isClientUploadPage = location.pathname.startsWith('/upload/');

  return (
    <div className="App min-h-screen flex flex-col bg-gray-50">
      {/* Conditional Navbar with responsive spacing */}
      {!isClientUploadPage && <Navbar />}
      
      {/* Global Loading Indicator */}
      <GlobalLoadingIndicator />
      
      {/* Main Content with responsive container and padding */}
      <main className="flex-grow w-full">
        <div className={`
          ${!isClientUploadPage ? 'pt-16 sm:pt-20' : ''} 
          pb-6 px-4 sm:px-6 lg:px-8
          min-h-0 flex-1
        `}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/upload/:requestId" element={<UploadPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Diagnostic route */}
            <Route path="/auth-diagnostics" element={<AuthDiagnostics />} />
            
            {/* Protected routes */}
            <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
            <Route path="/subscription" element={<ProtectedRoute element={<SubscriptionPlans />} />} />
            <Route path="/subscription/success" element={<ProtectedRoute element={<SubscriptionSuccess />} />} />
            <Route path="/subscription/cancel" element={<ProtectedRoute element={<SubscriptionCancel />} />} />
            
            {/* Fallback route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
      
      {/* Conditional Footer */}
      {!isClientUploadPage && <Footer />}
    </div>
  );
});

// Initialize app and provide context
const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App; 