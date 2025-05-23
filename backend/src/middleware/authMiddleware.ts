// backend/src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../config/supabase';

// Interface for the JWT payload
interface JwtPayload {
  userId: string;
  email?: string;
}

/**
 * Authentication middleware
 * Verifies JWT token in Authorization header
 */
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Get token from request headers
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: No token provided' });
      return;
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const secret = process.env.JWT_SECRET || 'your-jwt-secret-key';
    const decoded = jwt.verify(token, secret) as JwtPayload;
    
    // Add user data to request for use in route handlers
    (req as any).user = decoded;
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
};

/**
 * Simplified auth middleware for routes that only need userId from params
 * This allows endpoints to work without JWT if userId is provided in the URL
 */
export const simpleAuthMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const userId = req.params.userId;
    
    if (!userId) {
      // If no userId in params, try regular auth
      return authMiddleware(req, res, next);
    }
    
    // Set userId in req.user for route handlers
    (req as any).user = { userId };
    next();
  } catch (error) {
    console.error('Simple auth middleware error:', error);
    res.status(401).json({ error: 'Unauthorized' });
  }
}; 