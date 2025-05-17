// backend/src/index.ts
import express, { RequestHandler } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import fs from 'fs';
import path from 'path';
import { supabase } from './config/supabase';
import { initializeReminderScheduler } from './utils/reminderScheduler';
// import compression from 'compression';
// import rateLimit from 'express-rate-limit';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = parseInt( '3001', 10);

// Security and performance middleware
app.use(helmet()); // Security headers
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
// app.use(compression() as RequestHandler); // Compress responses
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiting to prevent abuse
// const apiLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, // 15 minutes
//   max: 100, // limit each IP to 100 requests per windowMs
//   standardHeaders: true,
//   legacyHeaders: false,
//   message: { 
//     error: 'Too many requests, please try again later.' 
//   }
// });
// app.use('/api', apiLimiter as RequestHandler);

// Routes
app.use('/api', apiRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Function to run SQL migrations
const runMigrations = async () => {
  try {
    // Get migration directory
    const migrationsDir = path.join(__dirname, '../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('No migrations directory found, skipping migrations');
      return;
    }
    
    // Read all migration files and sort them by name
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`Found ${migrationFiles.length} migration files`);
    
    // Execute each migration file directly with SQL
    for (const file of migrationFiles) {
      try {
        console.log(`Running migration: ${file}`);
        
        // Read the SQL file
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        // Execute the SQL directly
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
        
        if (error) {
          console.warn(`Warning in migration ${file}:`, error.message);
          // Continue with other migrations
        } else {
          console.log(`Migration ${file} completed successfully`);
        }
      } catch (err) {
        console.error(`Error in migration ${file}:`, err);
        // Continue with other migrations
      }
    }
    
    console.log('Migrations completed');
  } catch (error) {
    console.error('Error running migrations:', error);
  }
};

// Start server
const startServer = async () => {
  try {
    // Run database migrations first
    // await runMigrations();  // Commented out since we already ran migrations manually

    // Start the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      
      // Initialize the reminder scheduler if enabled
      if (process.env.ENABLE_REMINDERS === 'true') {
        const reminderInterval = parseInt(process.env.REMINDER_INTERVAL_HOURS || '12', 10);
        initializeReminderScheduler(reminderInterval);
        console.log(`Reminder scheduler initialized with ${reminderInterval} hour interval`);
      } else {
        console.log('Reminder scheduler disabled');
      }
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Error handling for unhandled rejections and exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  
  // For severe errors, it's often better to exit and let the process manager restart
  if (process.env.NODE_ENV === 'production') {
    console.error('Critical error, shutting down in 1 second...');
    setTimeout(() => process.exit(1), 1000);
  }
});

export default app;