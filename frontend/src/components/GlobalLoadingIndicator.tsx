import React from 'react';
import { useAppContext } from '../context/AppContext';

const GlobalLoadingIndicator: React.FC = () => {
  const { isLoading } = useAppContext();

  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-blue-100">
      <div 
        className="h-full bg-blue-500 animate-pulse"
        style={{ 
          width: '30%',
          animation: 'loading 1.5s ease-in-out infinite',
        }}
      />
      <style>{`
        @keyframes loading {
          0% {
            width: 0%;
            margin-left: 0%;
          }
          50% {
            width: 30%;
            margin-left: 35%;
          }
          100% {
            width: 0%;
            margin-left: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalLoadingIndicator; 