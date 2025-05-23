import { User } from 'firebase/auth';

// Re-export the Firebase User type
export type FirebaseUser = User;
 
// You can extend it with additional properties if needed
export interface ExtendedFirebaseUser extends User {
  // Add custom properties here if needed
  customClaims?: Record<string, any>;
} 