import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../config/supabase';
import { useAppContext } from '../context/AppContext';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const { setUserEmail } = useAppContext();
  
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for the auth callback in the URL
        const { data: authData, error: authError } = await supabase.auth.getSession();
        
        if (authError) {
          console.error('Auth callback error:', authError);
          navigate('/login');
          return;
        }
        
        if (authData.session) {
          // Successfully authenticated
          
          if (authData.session.user.email) {
            setUserEmail(authData.session.user.email);
          }
          
          navigate('/dashboard');
        } else {
          // No session found
          navigate('/login');
        }
      } catch (error) {
        console.error('Exception in auth callback:', error);
        navigate('/login');
      }
    };
    
    handleAuthCallback();
  }, [navigate, setUserEmail]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mb-4"></div>
      <p className="text-gray-600">Completing login...</p>
    </div>
  );
};

export default AuthCallback; 