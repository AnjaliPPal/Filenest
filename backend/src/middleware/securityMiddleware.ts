import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import { body, param, validationResult, ValidationError } from 'express-validator';
import dotenv from 'dotenv';

dotenv.config();

// Configure CORS - Dynamic based on environment
export const corsMiddleware = cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://filenest.app',
        'https://www.filenest.app',
        process.env.FRONTEND_URL || ''
      ].filter(Boolean)
    : [
        'http://localhost:3000',
        'http://localhost:3002',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL || ''
      ].filter(Boolean),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  credentials: true,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
});

// Configure rate limiting - more strict for production
export const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests, please try again later.'
  },
  skipSuccessfulRequests: false,
  skipFailedRequests: false
});

// Configure security headers - stricter for production
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "https://uqjlcpdltjvljwisxmpn.supabase.co", "https://file-nest.vercel.app"],
      frameSrc: ["'none'"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https:", "data:"],
      manifestSrc: ["'self'"],
      mediaSrc: ["'self'"],
      workerSrc: ["'none'"]
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  originAgentCluster: true,
  permittedCrossDomainPolicies: false,
  referrerPolicy: { policy: ["no-referrer"] },
  xssFilter: true
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