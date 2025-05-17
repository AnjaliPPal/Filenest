// backend/src/index.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import fs from 'fs';
import path from 'path';
import { supabase } from './config/supabase';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();
const PORT = 3001;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({ 
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Error handling
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export default app;