import { DbIntegrityService } from '../services/dbIntegrityService';
import { logger } from '../utils/logger';

// Run integrity check and report issues
async function checkIntegrity() {
  try {
    logger.info('Running database integrity check...');
    
    const [orphanedFiles, invalidRequests] = await Promise.all([
      DbIntegrityService.checkOrphanedFiles(),
      DbIntegrityService.checkInvalidRequests()
    ]);
    
    logger.info('Database integrity check complete', { orphanedFiles, invalidRequests });
    
    if (orphanedFiles > 0) {
      logger.warn(`Found ${orphanedFiles} orphaned files`);
    }
    
    if (invalidRequests > 0) {
      logger.warn(`Found ${invalidRequests} invalid requests with missing user references`);
    }
    
    if (orphanedFiles === 0 && invalidRequests === 0) {
      logger.info('No database integrity issues found');
    }
    
    return { orphanedFiles, invalidRequests };
  } catch (error: any) {
    logger.error('Error checking database integrity:', error);
    throw error;
  }
}

// Only run the function if executed directly (not imported)
if (require.main === module) {
  checkIntegrity()
    .then(results => {
      console.log('Database Integrity Check Results:');
      console.log('================================');
      console.log(`Orphaned Files: ${results.orphanedFiles}`);
      console.log(`Invalid Requests: ${results.invalidRequests}`);
      console.log('================================');
      console.log('Check complete.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Database integrity check failed:', error);
      process.exit(1);
    });
}

export default checkIntegrity; 