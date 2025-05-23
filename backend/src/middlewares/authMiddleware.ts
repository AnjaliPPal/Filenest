import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

// JWT secret from environment - MUST be set in production
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('JWT_SECRET environment variable is required in production');
}

// Use secure default only in development
const jwtSecret = JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'dev-jwt-secret-key' : '');

// Type definition for decoded JWT token
interface DecodedToken {
  userId: string;
  email: string;
  sessionId: string;
  iat: number;
  exp: number;
}

// Middleware to verify user authentication from JWT token
const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization token required' });
    return;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // First verify the JWT token
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    
    if (!decoded || !decoded.userId || !decoded.sessionId) {
      logger.warn('Invalid token format');
      res.status(401).json({ error: 'Invalid token format' });
      return;
    }
    
    // Then check if the token is still active in the database
    const { data, error } = await supabase
      .from('user_sessions')
      .select('is_active, expires_at, session_id')
      .eq('token', token)
      .eq('user_id', decoded.userId)
      .single();
    
    if (error || !data || !data.is_active) {
      logger.warn('Token not found in active sessions');
      res.status(401).json({ error: 'Invalid or expired token' });
      return;
    }
    
    // Verify the session ID matches
    if (data.session_id !== decoded.sessionId) {
      logger.warn('Session ID mismatch');
      res.status(401).json({ error: 'Invalid session' });
      return;
    }
    
    // Check if token has expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      logger.warn('Token has expired');
      res.status(401).json({ error: 'Token has expired' });
      return;
    }
    
    // Add user info to request object
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
    };
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ error: 'Invalid token' });
    } else if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else {
    res.status(401).json({ error: 'Authentication failed' });
    }
  }
};

// Middleware that tries to authenticate but continues even if not authenticated
const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Continue without authentication
    next();
    return;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify the JWT token
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;
    
    if (decoded && decoded.userId && decoded.sessionId) {
      // Check if token is still active
      const { data } = await supabase
        .from('user_sessions')
        .select('is_active, expires_at, session_id')
        .eq('token', token)
        .eq('user_id', decoded.userId)
        .single();
    
      if (data && data.is_active && data.session_id === decoded.sessionId && 
          (!data.expires_at || new Date(data.expires_at) >= new Date())) {
      // Add user info to request object
      req.user = {
          userId: decoded.userId,
          email: decoded.email,
      };
      }
    }
    
    // Continue whether authentication succeeded or not
    next();
  } catch (error) {
    // Continue even if authentication fails
    logger.debug('Optional authentication error:', error);
    next();
  }
};

export const authMiddleware = {
  authenticate,
  optionalAuth
}; 