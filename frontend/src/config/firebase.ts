// Import the functions you need from the SDKs you need
import { initializeApp, FirebaseApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Validate required environment variables
const requiredEnvVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID'
];

// Check for missing environment variables
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingVars.length > 0) {
  console.error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
}

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let analytics: Analytics | null = null;

try {
  // Initialize Firebase app
  app = initializeApp(firebaseConfig);
  
  // Initialize Firebase Auth
  auth = getAuth(app);
  
  // Initialize Firebase Analytics (only in production)
  if (typeof window !== 'undefined') {
    try {
      if (process.env.NODE_ENV === 'production') {
        analytics = getAnalytics(app);
      }
    } catch (error) {
      // Analytics might not be available in all environments
    }
  }
  
  // Connect to auth emulator in development if REACT_APP_USE_AUTH_EMULATOR is set
  if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_AUTH_EMULATOR === 'true') {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: false });
  }
  
  // Set persistence to local by default - ensures authentication state persists across page reloads
  auth.useDeviceLanguage();
} catch (error) {
  // Enhanced error logging
  if (error instanceof Error) {
    console.error(`Firebase initialization error: ${error.name} - ${error.message}`);
    
    // Log stack trace in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Stack trace:', error.stack);
    }
    
    // Check for specific error types
    if (error.message.includes('API key')) {
      console.error('Firebase API key issue - check your REACT_APP_FIREBASE_API_KEY environment variable');
    } else if (error.message.includes('auth')) {
      console.error('Firebase Auth issue - check your authentication configuration');
    } else if (error.message.includes('app')) {
      console.error('Firebase App initialization issue');
    }
  } else {
    console.error('Unknown Firebase initialization error:', error);
  }
  
  // Create a dummy app and auth for development to prevent crashes
  // This ensures types are consistent even if Firebase initialization fails
  app = {} as FirebaseApp;
  auth = {} as Auth;
}

// Export initialized instances
export { app, auth };
export default app;