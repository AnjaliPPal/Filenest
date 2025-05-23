import { DbIntegrityService } from '../services/dbIntegrityService';
import { logger } from '../utils/logger';

// Fix orphaned records in the database
async function fixOrphanedRecords() {
  try {
    logger.info('Starting orphaned records fix operation...');
    
    // Check for issues first
    const [initialOrphanedFiles, initialInvalidRequests] = await Promise.all([
      DbIntegrityService.checkOrphanedFiles(),
      DbIntegrityService.checkInvalidRequests()
    ]);
    
    logger.info('Initial database integrity status:', { 
      orphanedFiles: initialOrphanedFiles, 
      invalidRequests: initialInvalidRequests 
    });
    
    // Fix orphaned files
    if (initialOrphanedFiles > 0) {
      logger.info(`Attempting to fix ${initialOrphanedFiles} orphaned files...`);
      const fixedFiles = await DbIntegrityService.fixOrphanedFiles();
      logger.info(`Fixed ${fixedFiles} orphaned files`);
    }
    
    // Fix invalid requests
    if (initialInvalidRequests > 0) {
      logger.info(`Attempting to fix ${initialInvalidRequests} invalid requests...`);
      const fixedRequests = await DbIntegrityService.fixInvalidRequests();
      logger.info(`Fixed ${fixedRequests} invalid requests`);
    }
    
    // Verify fixes
    const [remainingOrphanedFiles, remainingInvalidRequests] = await Promise.all([
      DbIntegrityService.checkOrphanedFiles(),
      DbIntegrityService.checkInvalidRequests()
    ]);
    
    logger.info('Final database integrity status:', { 
      orphanedFiles: remainingOrphanedFiles, 
      invalidRequests: remainingInvalidRequests 
    });
    
    return {
      initial: { orphanedFiles: initialOrphanedFiles, invalidRequests: initialInvalidRequests },
      remaining: { orphanedFiles: remainingOrphanedFiles, invalidRequests: remainingInvalidRequests },
      fixed: { 
        orphanedFiles: initialOrphanedFiles - remainingOrphanedFiles, 
        invalidRequests: initialInvalidRequests - remainingInvalidRequests 
      }
    };
  } catch (error: any) {
    logger.error('Error fixing orphaned records:', error);
    throw error;
  }
}

// Only run the function if executed directly (not imported)
if (require.main === module) {
  fixOrphanedRecords()
    .then(results => {
      console.log('Orphaned Records Fix Results:');
      console.log('=======================================');
      console.log(`Initial Orphaned Files: ${results.initial.orphanedFiles}`);
      console.log(`Initial Invalid Requests: ${results.initial.invalidRequests}`);
      console.log('---------------------------------------');
      console.log(`Fixed Orphaned Files: ${results.fixed.orphanedFiles}`);
      console.log(`Fixed Invalid Requests: ${results.fixed.invalidRequests}`);
      console.log('---------------------------------------');
      console.log(`Remaining Orphaned Files: ${results.remaining.orphanedFiles}`);
      console.log(`Remaining Invalid Requests: ${results.remaining.invalidRequests}`);
      console.log('=======================================');
      console.log('Fix operation complete.');
      process.exit(0);
    })
    .catch(error => {
      console.error('Fix operation failed:', error);
      process.exit(1);
    });
}

export default fixOrphanedRecords; 