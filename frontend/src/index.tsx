import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

// Debug environment variables
console.log('Environment Variables:');
console.log('REACT_APP_SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL);
console.log('REACT_APP_SUPABASE_ANON_KEY exists:', !!process.env.REACT_APP_SUPABASE_ANON_KEY);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);

ReactDOM.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
  document.getElementById('root')
); 