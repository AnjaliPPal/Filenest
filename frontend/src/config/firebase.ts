

// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from 'firebase/auth';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1nN3FRfxSYkzAi_6kf1CTMdKnrZS7jvw",
  authDomain: "filenest-5091a.firebaseapp.com",
  projectId: "filenest-5091a",
  storageBucket: "filenest-5091a.firebasestorage.app",
  messagingSenderId: "423552256471",
  appId: "1:423552256471:web:4b768b7b5ea42715bb2392",
  measurementId: "G-N7XME7DJGQ"
};

// Initialize Firebase
// const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);

const app = initializeApp(firebaseConfig);
const auth = getAuth(app); // <-- Make sure this is a 'const', not 'export const'

export { app, auth }; // <-- Export both app and auth
export default app;