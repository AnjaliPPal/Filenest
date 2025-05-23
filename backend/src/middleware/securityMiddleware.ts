import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import { body, param, validationResult, ValidationError } from 'express-validator';
import dotenv from 'dotenv';

dotenv.config();

// Configure CORS
export const corsMiddleware = cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3002',
    'https://file-nest.vercel.app',
    process.env.FRONTEND_URL || ''
  ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400 // 24 hours
});

// Configure rate limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.'
  }
});

// Configure security headers
export const securityHeaders = helmet({
  contentSecurityPolicy: false, // Disabled for development
  crossOriginEmbedderPolicy: false, // Disabled for development
});

// Validation middleware factory
export const validate = (validations: any[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    await Promise.all(validations.map(validation => validation.run(req)));

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      next();
      return;
    }

    res.status(400).json({ 
      errors: errors.array().map((err: ValidationError) => ({ 
        param: err.type === 'field' ? err.path : err.type,
        msg: err.msg 
      }))
    });
  };
};

// Common validation rules
export const validationRules = {
  // Request validations
  createRequest: [
    body('title').trim().isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
    body('description').optional().trim().isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
    body('clientEmail').trim().isEmail().withMessage('Valid client email is required'),
    body('dueDate').optional().isISO8601().withMessage('Due date must be a valid date')
  ],
  
  // File validations
  uploadFile: [
    param('requestId').isUUID().withMessage('Valid request ID is required')
  ],
  
  // User validations
  validateUserId: [
    param('userId').isUUID().withMessage('Valid user ID is required')
  ],
  
  // Subscription validations
  createCheckout: [
    body('priceId').isString().withMessage('Price ID is required'),
    body('userId').isUUID().withMessage('Valid user ID is required'),
    body('email').isEmail().withMessage('Valid email is required')
  ]
}; 