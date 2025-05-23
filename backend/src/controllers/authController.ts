import { Request, Response } from 'express';
import { supabase } from '../config/supabase';
import { logger } from '../utils/logger';
import jwt, { SignOptions } from 'jsonwebtoken';
import axios from 'axios';
import * as admin from 'firebase-admin';
import crypto from 'crypto';

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

// JWT secret from environment - MUST be set in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// Use secure default only in development
const jwtSecret = JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-jwt-secret-key' : '');

// JWT options
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d'; // Token expires in 7 days
const JWT_OPTIONS: SignOptions = {
  expiresIn: JWT_EXPIRES_IN as any,
  algorithm: 'HS256'
};

// Helper function for creating JWT tokens to avoid duplicate code
const createToken = (userId: string, email: string, sessionId: string): string => {
  return jwt.sign(
    { userId, email, sessionId },
    jwtSecret,
    JWT_OPTIONS
  );
};

/**
 * Login user with email
 * Simple authentication using email only (no password)
 */
export const loginWithEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ error: 'Invalid email format' });
      return;
    }

    // Find or create user
    let user;
    
    // Check if user exists
    const { data: existingUser, error: userError } = await supabase
      .from('users')
      .select('id, email, name, profile_picture')
      .eq('email', email)
      .single();
    
    if (userError || !existingUser) {
      // Create new user
      logger.info(`Creating new user with email: ${email}`);
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({ email })
        .select('id, email, name, profile_picture')
        .single();
      
      if (createError || !newUser) {
        logger.error(`Failed to create user with email ${email}:`, createError);
        res.status(500).json({ error: 'Failed to create user account' });
        return;
      }
      
      user = newUser;
    } else {
      user = existingUser;
    }
    
    // Generate a secure session ID
    const sessionId = crypto.randomBytes(32).toString('hex');
    
    // Create JWT token
    const token = createToken(user.id, user.email, sessionId);
    
    const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    
    // Store session with expiry and reference to the user
    const { error: sessionError } = await supabase
      .from('user_sessions')
      .insert({
        user_id: user.id,
        token,
        session_id: sessionId,
        expires_at: expiryDate.toISOString(),
        is_active: true,
        ip_address: req.ip,
        user_agent: req.headers['user-agent'] || 'unknown'
      });
    
    if (sessionError) {
      logger.warn('Failed to store session, continuing anyway:', sessionError);
    }
    
    // Send back the token - but not sensitive information
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profile_picture
      },
      token,
      expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Login with Google using Firebase Authentication token
 * Validates the token, extracts user info, and creates/authenticates a user
 */
export const loginWithGoogle = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({ error: 'Google token is required' });
      return;
    }
    
    logger.info('Processing Google login with token');
    
    try {
      // Verify the token with Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      if (!decodedToken.email || !decodedToken.email_verified) {
        logger.error('Token missing email or email not verified');
        res.status(400).json({ error: 'Invalid token - email required and must be verified' });
        return;
      }
      
      // Get user info from the token
      const email = decodedToken.email;
      const name = decodedToken.name || '';
      const picture = decodedToken.picture || '';
      
      logger.info(`Google login for email: ${email}`);
      
      // Find or create user
      let user;
      
      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, email, name, profile_picture')
        .eq('email', email)
        .single();
      
      if (userError || !existingUser) {
        // Create new user
        logger.info(`Creating new user from Google login: ${email}`);
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({ 
            email,
            name,
            profile_picture: picture
          })
          .select('id, email, name, profile_picture')
          .single();
        
        if (createError || !newUser) {
          logger.error(`Failed to create user from Google login ${email}:`, createError);
          res.status(500).json({ error: 'Failed to create user account' });
          return;
        }
        
        user = newUser;
      } else {
        user = existingUser;
        
        // Update user profile if needed
        if (name || picture) {
          await supabase
            .from('users')
            .update({ 
              name: name || user.name,
              profile_picture: picture || user.profile_picture
            })
            .eq('id', user.id);
        }
      }
      
      // Generate a secure session ID
      const sessionId = crypto.randomBytes(32).toString('hex');
      
      // Create JWT token
      const appToken = createToken(user.id, user.email, sessionId);
      
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      // Store session with expiry and reference to the user
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          token: appToken,
          session_id: sessionId,
          expires_at: expiryDate.toISOString(),
          is_active: true,
          provider: 'google',
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] || 'unknown'
        });
      
      if (sessionError) {
        logger.warn('Failed to store session, continuing anyway:', sessionError);
      }
      
      // Send back the token
      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePicture: user.profile_picture
        },
        token: appToken,
        expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
      });
      
    } catch (tokenError) {
      logger.error('Failed to verify Google token:', tokenError);
      res.status(400).json({ error: 'Invalid token' });
    }
  } catch (error) {
    logger.error('Google login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Logout user by invalidating their token
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(400).json({ error: 'No token provided' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Invalidate the token in the database
    if (req.user?.userId) {
      const { error: updateError } = await supabase
        .from('user_sessions')
        .update({ is_active: false })
        .eq('user_id', req.user.userId)
        .eq('token', token);
      
      if (updateError) {
        logger.warn('Failed to invalidate session, continuing anyway:', updateError);
      }
    }
    
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get current user info
 */
export const getCurrentUser = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user?.userId) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }
    
    // Get user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, name, profile_picture')
      .eq('id', req.user.userId)
      .single();
    
    if (userError || !user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Get subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier')
      .eq('user_id', user.id)
      .single();
    
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profilePicture: user.profile_picture,
        subscription: subscription?.tier || 'free'
      }
    });
  } catch (error) {
    logger.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Validate Firebase ID token and return a server JWT token
 * Used by the frontend to validate Google Auth tokens
 */
export const validateToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    
    if (!token) {
      res.status(400).json({ error: 'Token is required' });
      return;
    }
    
    try {
      // Verify the token with Firebase Admin
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      if (!decodedToken.email || !decodedToken.email_verified) {
        res.status(400).json({ error: 'Invalid token - email required and must be verified' });
        return;
      }
      
      // Get user info from the token
      const email = decodedToken.email;
      const name = decodedToken.name || '';
      const picture = decodedToken.picture || '';
      
      // Find or create user
      let user;
      
      // Check if user exists
      const { data: existingUser, error: userError } = await supabase
        .from('users')
        .select('id, email, name, profile_picture')
        .eq('email', email)
        .single();
      
      if (userError || !existingUser) {
        // Create new user
        const { data: newUser, error: createError } = await supabase
          .from('users')
          .insert({ 
            email,
            name,
            profile_picture: picture
          })
          .select('id, email, name, profile_picture')
          .single();
        
        if (createError || !newUser) {
          res.status(500).json({ error: 'Failed to create user account' });
          return;
        }
        
        user = newUser;
      } else {
        user = existingUser;
      }
      
      // Generate a secure session ID
      const sessionId = crypto.randomBytes(32).toString('hex');
      
      // Create JWT token
      const appToken = createToken(user.id, user.email, sessionId);
      
      const expiryDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      
      // Store session with expiry and reference to the user
      const { error: sessionError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: user.id,
          token: appToken,
          session_id: sessionId,
          expires_at: expiryDate.toISOString(),
          is_active: true,
          ip_address: req.ip,
          user_agent: req.headers['user-agent'] || 'unknown'
        });
      
      if (sessionError) {
        res.status(500).json({ error: 'Failed to create session' });
        return;
      }
      
      // Send back the token
      res.status(200).json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          profilePicture: user.profile_picture
        },
        token: appToken,
        expiresIn: 7 * 24 * 60 * 60 // 7 days in seconds
      });
      
    } catch (tokenError) {
      res.status(400).json({ error: 'Invalid token' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
}; 