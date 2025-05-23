import fs from 'fs';
import path from 'path';
import { supabase } from '../config/supabase';

const MIGRATIONS_DIR = path.join(__dirname, '../../migrations');

async function runMigrations() {
  console.log('Starting migrations from:', MIGRATIONS_DIR);
  
  // Get all migration files
  const migrationFiles = fs.readdirSync(MIGRATIONS_DIR)
    .filter(file => file.endsWith('.sql'))
    .sort(); // Sort to ensure migrations run in order
  
  console.log('Found', migrationFiles.length, 'migration files:', migrationFiles);
  
  // Run each migration
  for (const file of migrationFiles) {
    console.log('Running migration:', file);
    const filePath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(filePath, 'utf8');
    
    console.log('Migration SQL content (first 100 chars):', sql.substring(0, 100));
    
    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      
      if (error) {
        console.log(`Migration ${file} completed with error:`, error);
      } else {
        console.log(`Migration ${file} completed successfully`, { success: true });
      }
    } catch (err) {
      console.error(`Error running migration ${file}:`, err);
    }
  }
  
  console.log('Migrations completed');
}

// Run migrations
runMigrations().catch(console.error); 