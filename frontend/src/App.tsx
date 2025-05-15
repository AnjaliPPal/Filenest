import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './components/Home';
import Navbar from './components/Navbar';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/ErrorBoundary';
import GlobalLoadingIndicator from './components/GlobalLoadingIndicator';
import UploadPage from './components/UploadPage';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <div className="App min-h-screen flex flex-col bg-gray-50">
            <Navbar />
            <GlobalLoadingIndicator />
            <main className="flex-grow container mx-auto px-4 pt-20 pb-6">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/upload/:requestId" element={<UploadPage />} />
                {/* Additional routes will be added in future days */}
              </Routes>
            </main>
            <footer className="py-6 bg-gray-900 text-gray-300">
              <div className="container mx-auto px-4">
                <div className="flex flex-col md:flex-row justify-between items-center">
                  <div className="mb-4 md:mb-0">
                    <span className="font-bold text-xl text-white">
                      File<span className="text-blue-400">Nest</span>
                    </span>
                    <p className="text-sm mt-1">Secure file requests and uploads made simple.</p>
                  </div>
                  <div className="text-sm">
                    <p>© {new Date().getFullYear()} FileNest. All rights reserved.</p>
                  </div>
                </div>
              </div>
            </footer>
          </div>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
};

export default App; 