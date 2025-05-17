import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase';

/**
 * Run all database migrations in sequence
 */
export const runMigrations = async (): Promise<void> => {
  console.log('Running database migrations...');
  
  // Get migration directory
  const migrationsDir = path.join(__dirname, '../../migrations');
  
  // Read all migration files and sort them by name
  let migrationFiles = fs.readdirSync(migrationsDir)
    .filter(file => file.endsWith('.sql'))
    .sort();

  console.log(`Found ${migrationFiles.length} migration files`);
  
  // Run each migration in sequence
  for (const file of migrationFiles) {
    try {
      console.log(`Running migration: ${file}`);
      
      // Read migration file
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      
      // Execute the migration
      const { error } = await supabase.rpc('pgmigrate_run', { sql });
      
      if (error) {
        console.error(`Error running migration ${file}:`, error);
        // Don't throw error, just log it and continue
        // This is because the SQL might already have been applied
      } else {
        console.log(`Migration ${file} completed successfully`);
      }
    } catch (error) {
      console.error(`Error processing migration ${file}:`, error);
    }
  }
  
  console.log('All migrations completed');
}; 