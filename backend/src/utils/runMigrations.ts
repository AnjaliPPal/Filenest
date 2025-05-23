import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase';
import { logger } from './logger';

/**
 * Run all database migrations in sequence
 */
export async function runMigrations(): Promise<void> {
  try {
    logger.info('Starting database migrations');
    
    // Create migrations table if it doesn't exist
    const { error: createTableError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS migrations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) UNIQUE NOT NULL,
          executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `
    });
    
    if (createTableError) {
      logger.error('Error creating migrations table:', createTableError);
      return;
    }

    // Get list of applied migrations
    const { data: appliedMigrations, error: selectError } = await supabase
      .from('migrations')
      .select('name')
      .order('id', { ascending: true });
      
    if (selectError) {
      logger.error('Error fetching applied migrations:', selectError);
      return;
    }
    
    const appliedMigrationNames = new Set(appliedMigrations?.map(m => m.name) || []);
    
    // Get migration files
    const migrationsDir = path.join(__dirname, '../../migrations');
    let migrationFiles: string[] = [];
    
    try {
      migrationFiles = fs.readdirSync(migrationsDir)
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (readError) {
      logger.error('Error reading migrations directory:', readError);
      return;
    }
    
    // Run unapplied migrations
    for (const file of migrationFiles) {
      if (appliedMigrationNames.has(file)) {
        logger.info(`Migration ${file} already applied, skipping`);
        continue;
      }
      
      try {
        const filePath = path.join(migrationsDir, file);
        const sql = fs.readFileSync(filePath, 'utf8');
        
        logger.info(`Applying migration: ${file}`);
        
        // Execute migration
        const { error: migrationError } = await supabase.rpc('exec_sql', {
          sql_query: sql
        });
        
        if (migrationError) {
          logger.error(`Error applying migration ${file}:`, migrationError);
          continue;
        }
        
        // Record successful migration
        const { error: insertError } = await supabase
          .from('migrations')
          .insert({ name: file });
          
        if (insertError) {
          logger.error(`Error recording migration ${file}:`, insertError);
        } else {
          logger.info(`Migration ${file} applied successfully`);
        }
      } catch (migrationError) {
        logger.error(`Exception during migration ${file}:`, migrationError);
      }
    }
    
    logger.info('Database migrations completed');
  } catch (error) {
    logger.error('Migration process error:', error);
    throw error;
  }
} 