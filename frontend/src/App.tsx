import React from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './components/Home';
import Navbar from './components/Navbar';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalLoadingIndicator from './components/GlobalLoadingIndicator';
import UploadPage from './components/UploadPage';
import Dashboard from './components/Dashboard';
import LoginPage from './components/LoginPage';
import Footer from './components/Footer';

// Helper component to use hooks outside Router
const AppContent: React.FC = () => {
  const location = useLocation();
  const isClientUploadPage = location.pathname.startsWith('/upload/');

  return (
    <div className="App min-h-screen flex flex-col bg-gray-50">
      {!isClientUploadPage && <Navbar />}
      <GlobalLoadingIndicator />
      <main className="flex-grow container mx-auto px-4 pt-20 pb-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/upload/:requestId" element={<UploadPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/login" element={<LoginPage />} />
        </Routes>
      </main>
      {!isClientUploadPage && <Footer />}
    </div>
  );
};

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