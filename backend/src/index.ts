// backend/src/index.ts
import express, { RequestHandler, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import authRoutes from './routes/authRoutes';
import subscriptionRoutes from './routes/subscriptionRoutes';
import gdprRoutes from './routes/gdprRoutes';
import fs from 'fs';
import path from 'path';
import { supabase } from './config/supabase';
import { initializeReminderScheduler } from './utils/reminderScheduler';
import { initializeExpiryManager } from './utils/expiryManager';
import compression from 'compression';
import rateLimit, { RateLimitRequestHandler } from 'express-rate-limit';
import { corsMiddleware, apiLimiter, securityHeaders } from './middleware/securityMiddleware';
import { runMigrations } from './utils/runMigrations';
import { logger } from './utils/logger';
import { DbIntegrityService } from './services/dbIntegrityService';

// Load environment variables
dotenv.config();

// Debug environment loading
console.log("Environment variables loaded:");
console.log("process.env.PORT:", process.env.PORT);
console.log("NODE_ENV:", process.env.NODE_ENV);

// Create Express app
const app = express();

// Better port handling with explicit precedence
// In development: prefer .env file, fallback to 3001
// In production: use platform-assigned PORT, fallback to 8080
const PORT = process.env.PORT || 3001; 
console.log("Backend port:-----------", PORT);
console.log("Environment:", process.env.NODE_ENV);

// CORS must come before other middleware
app.use(corsMiddleware);

// Use helmet for security headers
app.use(helmet() as any);

// Additional security headers
app.use(securityHeaders as any);

// Parse JSON request body
app.use(express.json({ limit: '5mb' }));

// Parse URL-encoded request body
app.use(express.urlencoded({ extended: true, limit: '5mb' }));

// Compression to save bandwidth - fix TypeScript type issue
app.use(compression() as any);

// Rate limiting to prevent abuse - make sure this comes after core middleware
app.use('/api', apiLimiter as any);

// Routes
app.use('/api', apiRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/gdpr', gdprRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Privacy policy endpoint
app.get('/privacy-policy', (req, res) => {
  res.status(200).json({
    title: 'Privacy Policy',
    lastUpdated: new Date().toISOString().split('T')[0],
    content: `
      <h1>Privacy Policy</h1>
      <p>Last updated: ${new Date().toISOString().split('T')[0]}</p>
      
      <h2>1. Introduction</h2>
      <p>This Privacy Policy explains how we collect, use, process, and disclose your information when you use FileNest.</p>
      
      <h2>2. Information We Collect</h2>
      <p>We collect information you provide directly to us, such as your name, email address, and any files you upload.</p>
      
      <h2>3. How We Use Your Information</h2>
      <p>We use your information to provide, maintain, and improve our services, including file storage and sharing.</p>
      
      <h2>4. Data Retention</h2>
      <p>We retain your data as long as your account is active or as needed to provide services. You can request deletion of your data at any time.</p>
      
      <h2>5. Your Rights</h2>
      <p>You have the right to access, update, or delete your personal information. You can also request a copy of your data.</p>
      
      <h2>6. Security</h2>
      <p>We implement appropriate security measures to protect your data. All files are encrypted at rest.</p>
      
      <h2>7. Changes to This Policy</h2>
      <p>We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new policy on this page.</p>
      
      <h2>8. Contact Us</h2>
      <p>If you have any questions about this Privacy Policy, please contact us.</p>
    `
  });
});

// Error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal Server Error' 
      : err.message || 'Something went wrong'
  });
});

// Start server
const startServer = async () => {
  try {
    // Run migrations
    await runMigrations();
    
    // Initialize the database integrity service
    try {
      await DbIntegrityService.initialize();
    } catch (dbIntegrityError) {
      logger.error('Error initializing database service:', dbIntegrityError);
    }

    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      
      // Initialize the reminder scheduler if enabled
      if (process.env.ENABLE_REMINDERS === 'true') {
        const reminderInterval = parseInt(process.env.REMINDER_INTERVAL_HOURS || '12', 10);
        initializeReminderScheduler(reminderInterval);
        logger.info(`Reminder scheduler initialized with ${reminderInterval} hour interval`);
      } else {
        logger.info('Reminder scheduler disabled');
      }
      
      // Initialize auto-expiry manager
      initializeExpiryManager(24); // Check for expired requests daily
      logger.info('Expiry manager initialized with 24 hour interval');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Error handling for unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  
  // For severe errors, it's often better to exit and let the process manager restart
  if (process.env.NODE_ENV === 'production') {
    logger.error('Critical error, shutting down in 1 second...');
    setTimeout(() => process.exit(1), 1000);
  }
});

export default app;